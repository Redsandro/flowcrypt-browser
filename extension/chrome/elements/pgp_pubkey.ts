/* © 2016-2018 FlowCrypt Limited. Limitations apply. Contact human@flowcrypt.com */

'use strict';

import { Store, Contact } from '../../js/common/store.js';
import { Catch, Env, Str } from './../../js/common/common.js';
import { Xss, Ui } from '../../js/common/browser.js';
import { mnemonic } from './../../js/common/mnemonic.js';

import { Pgp } from '../../js/common/pgp.js';
import { BrowserMsg } from '../../js/common/extension.js';

declare let openpgp: typeof OpenPGP;

Catch.try(async () => {

  // todo - this should use KeyImportUI for consistency. Needs general refactoring, hard to follow.

  Ui.event.protect();

  let url_params = Env.url_params(['account_email', 'armored_pubkey', 'parent_tab_id', 'minimized', 'compact', 'frame_id']);
  let account_email = Env.url_param_require.string(url_params, 'account_email');
  let parent_tab_id = Env.url_param_require.string(url_params, 'parent_tab_id');
  let armored_pubkey = Env.url_param_require.string(url_params, 'armored_pubkey');
  let frame_id = Env.url_param_require.string(url_params, 'frame_id');
  // minimized means I have to click to see details. Compact means the details take up very little space.

  let pubkeys: OpenPGP.key.Key[] = openpgp.key.readArmored(armored_pubkey).keys;

  let send_resize_msg = () => {
    let desired_height = $('#pgp_block').height()! + (url_params.compact ? 10 : 30); // #pgp_block is defined in template
    BrowserMsg.send(parent_tab_id, 'set_css', {selector: `iframe#${frame_id}`, css: {height: `${desired_height}px`}});
  };

  let set_button_text = async () => {
    if (pubkeys.length > 1) {
      $('.action_add_contact').text('import ' + pubkeys.length + ' public keys');
    } else {
      let [contact] = await Store.db_contact_get(null, [$('.input_email').val() as string]); // text input
      $('.action_add_contact').text(contact && contact.has_pgp ? 'update contact' : 'add to contacts');
    }
  };

  let render = async () => {
    $('.pubkey').text(url_params.armored_pubkey as string);
    if (url_params.compact) {
      $('.hide_if_compact').remove();
      $('body').css({border: 'none', padding: 0});
      $('.line').removeClass('line');
    }
    $('.line.fingerprints, .line.add_contact').css('display', url_params.minimized ? 'none' : 'block');
    if (pubkeys.length === 1) {
      $('.line.fingerprints .fingerprint').text(Pgp.key.fingerprint(pubkeys[0], 'spaced') as string);
      $('.line.fingerprints .keywords').text(mnemonic(Pgp.key.longid(pubkeys[0]) || '') || '');
    } else {
      $('.line.fingerprints').css({display: 'none'});
    }
    if (typeof pubkeys[0] !== 'undefined') {
      if ((await pubkeys[0].getEncryptionKey() === null) && (await pubkeys[0].getSigningKey() === null)) {
        $('.line.add_contact').addClass('bad').text('This public key looks correctly formatted, but cannot be used for encryption. Email human@flowcrypt.com to get this resolved.');
        $('.line.fingerprints').css({ display: 'none', visibility: 'hidden' });
      } else {
        if (pubkeys.length === 1) {
          let email = pubkeys[0].users[0].userId ? Str.parse_email(pubkeys[0].users[0].userId ? pubkeys[0].users[0].userId!.userid : '').email : null;
          if (email) {
            $('.input_email').val(email); // checked above
            $('.email').text(email);
          }
        } else {
          $('.email').text('more than one person');
          $('.input_email').css({display: 'none'});
          Xss.sanitize_append('.add_contact', Xss.html_escape(' for ' + pubkeys.map(pubkey => Str.parse_email(pubkey.users[0].userId ? pubkey.users[0].userId!.userid : '').email).filter(e => Str.is_email_valid(e)).join(', ')));
        }
        set_button_text().catch(Catch.rejection);
      }
    } else {
      let fixed = url_params.armored_pubkey as string;
      while(/\n> |\n>\n/.test(fixed)) {
        fixed = fixed.replace(/\n> /g, '\n').replace(/\n>\n/g, '\n\n');
      }
      if (fixed !== url_params.armored_pubkey) { // try to re-render it after un-quoting, (minimized because it is probably their own pubkey quoted by the other guy)
        window.location.href = Env.url_create('pgp_pubkey.htm', { armored_pubkey: fixed, minimized: true, account_email: url_params.account_email, parent_tab_id: url_params.parent_tab_id, frame_id: url_params.frame_id });
      } else {
        $('.line.add_contact').addClass('bad').text('This public key is invalid or has unknown format.');
        $('.line.fingerprints').css({ display: 'none', visibility: 'hidden' });
      }
    }
  };

  $('.action_add_contact').click(Ui.event.handle(async target => {
    if (pubkeys.length > 1) {
      let contacts: Contact[] = [];
      for (let pubkey of pubkeys) {
        let email_address = Str.parse_email(pubkey.users[0].userId ? pubkey.users[0].userId!.userid : '').email;
        if (Str.is_email_valid(email_address)) {
          contacts.push(Store.db_contact_object(email_address, null, 'pgp', pubkey.armor(), null, false, Date.now()));
        }
      }
      await Store.db_contact_save(null, contacts);
      Xss.sanitize_replace(target, '<span class="good">added public keys</span>');
      $('.input_email').remove();
    } else if (pubkeys.length) {
      if (Str.is_email_valid($('.input_email').val() as string)) { // text input
        let contact = Store.db_contact_object($('.input_email').val() as string, null, 'pgp', pubkeys[0].armor(), null, false, Date.now()); // text input
        await Store.db_contact_save(null, contact);
        Xss.sanitize_replace(target, `<span class="good">${Xss.html_escape(String($('.input_email').val()))} added</span>`);
        $('.input_email').remove();
      } else {
        alert('This email is invalid, please check for typos. Not added.');
        $('.input_email').focus();
      }
    }
  }));

  $('.input_email').keyup(() => set_button_text());

  $('.action_show_full').click(Ui.event.handle(target => {
    $(target).css('display', 'none');
    $('pre.pubkey, .line.fingerprints, .line.add_contact').css('display', 'block');
    send_resize_msg();
  }));

  await render();
  send_resize_msg();

})();
