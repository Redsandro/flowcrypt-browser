'use strict';

var url_params = get_url_params(['account_email', 'action']);

account_storage_get(url_params.account_email, ['setup_simple'], function(storage) {
  if(url_params.action === 'setup') {
    $('.back').css('display', 'none');
    if(storage.setup_simple) {
      display_block('step_1_password');
      $('h1').text('Choose a pass phrase');
    } else {
      display_block('step_3_manual');
      $('h1').text('Back up your private key');
    }
  } else {
    show_status();
  }
});

function display_block(name) {
  var blocks = ['loading', 'step_0_status', 'step_1_password', 'step_2_confirm', 'step_3_manual'];
  $.each(blocks, function(i, block) {
    $('#' + block).css('display', 'none');
  });
  $('#' + name).css('display', 'block');
}

$('#password').on('keyup', prevent(spree(), function() {
  evaluate_password_strength('#step_1_password', '#password', '.action_password');
}));

function show_status() {
  $('.hide_if_backup_done').css('display', 'none');
  $('h1').text('Key Backups');
  display_block('loading');
  account_storage_get(url_params.account_email, ['setup_simple', 'key_backup_method'], function(storage) {
    fetch_email_key_backups(url_params.account_email, function(success, keys) {
      if(success) {
        display_block('step_0_status');
        if(keys && keys.length) {
          $('.status_summary').text('Backups found: ' + keys.length + '. Your account is backed up correctly on Gmail.');
          $('#step_0_status .container').html('<div class="button long green action_go_manual">SEE MORE BACKUP OPTIONS</div>');
          $('.action_go_manual').click(function() {
            display_block('step_3_manual');
            $('h1').text('Back up your private key');
          });
        } else if(storage.key_backup_method) {
          if(storage.key_backup_method === 'file') {
            $('.status_summary').text('You have previously backed up your key into a file.');
            $('#step_0_status .container').html('<div class="button long green action_go_manual">SEE OTHER BACKUP OPTIONS</div>');
            $('.action_go_manual').click(function() {
              display_block('step_3_manual');
              $('h1').text('Back up your private key');
            });
          } else if(storage.key_backup_method === 'print') {
            $('.status_summary').text('You have previously backed up your key by printing it.');
            $('#step_0_status .container').html('<div class="button long green action_go_manual">SEE OTHER BACKUP OPTIONS</div>');
            $('.action_go_manual').click(function() {
              display_block('step_3_manual');
              $('h1').text('Back up your private key');
            });
          } else { // gmail or other methods
            $('.status_summary').text('There are no backups on this account. If you lose your device, or it stops working, you will not be able to read your encrypted email.');
            $('#step_0_status .container').html('<div class="button long green action_go_manual">SEE BACKUP OPTIONS</div>');
            $('.action_go_manual').click(function() {
              display_block('step_3_manual');
              $('h1').text('Back up your private key');
            });
          }
        } else {
          if(storage.setup_simple) {
            $('.status_summary').text('No backups found on this account. You can store a backup of your key on Gmail. Your key will be protected by a pass phrase of your choice.');
            $('#step_0_status .container').html('<div class="button long green action_go_backup">BACK UP MY KEY</div><br><br><br><a href="#" class="action_go_manual">See more advanced backup options</a>');
            $('.action_go_backup').click(function() {
              display_block('step_1_password');
              $('h1').text('Set Backup Pass Phrase');
            });
            $('.action_go_manual').click(function() {
              display_block('step_3_manual');
              $('h1').text('Back up your private key');
            });
          } else {
            $('.status_summary').text('No backups found on this account. If you lose your device, or it stops working, you will not be able to read your encrypted email.');
            $('#step_0_status .container').html('<div class="button long green action_go_manual">BACK UP MY KEY</div>');
            $('.action_go_manual').click(function() {
              display_block('step_3_manual');
              $('h1').text('Back up your private key');
            });
          }
        }
      } else {
        $('.status_summary').text('Could not start searching for backups, possibly due to a network failure. Refresh to try again.');
        $('#step_0_status .container').html('<div class="button long green action_refresh">REFRESH</div>');
        $('.action_refresh').click(prevent(doubleclick(), show_status));
      }
    });
  });
}

$('.action_password').click(function() {
  if($(this).hasClass('green')) {
    display_block('step_2_confirm');
  } else {
    alert('Please select a stronger pass phrase. Combinations of 4 to 5 uncommon words are the best.');
  }
});

$('.action_reset_password').click(function() {
  $('#password').val('');
  $('#password2').val('');
  display_block('step_1_password');
  evaluate_password_strength();
  $('#password').focus();
});

function backup_key_on_gmail(account_email, armored_key, error_callback) {
  var email_headers = {
    From: account_email,
    To: account_email,
    Subject: recovery_email_subjects[0],
  };
  $.get('email_intro.template.htm', null, function(email_message) {
    $.get('/img/email/msg_new.png', null, function(msg_new_png) {
      $.get('/img/email/msg_reply.png', null, function(msg_reply_png) {
        var email_attachments = [{
          filename: 'cryptup-backup-' + account_email.replace(/[^A-Za-z0-9]+/g, '') + '.key',
          type: 'text/plain',
          content: armored_key,
        }];
        var text = {
          'text/html': email_message
        };
        to_mime(url_params.account_email, text, email_headers, email_attachments, function(mime_message) {
          gmail_api_message_send(url_params.account_email, mime_message, null, function(success, response) {
            if(success) { // todo - test pulling it and decrypting it right away
              write_backup_done_and_render(false, 'gmail');
            } else {
              error_callback('Need internet connection to finish setting up your account. Please clicking the button again to retry.');
            }
          });
        });
      });
    });
  });
}

$('.action_backup').click(prevent(doubleclick(), function(self) {
  var new_passphrase = $('#password').val();
  if(new_passphrase !== $('#password2').val()) {
    alert('The two pass phrases do not match, please try again.');
    $('#password2').val('');
    $('#password2').focus();
  } else {
    var btn_text = $(self).text();
    $(self).html(get_spinner());
    var armored_private_key = private_storage_get(localStorage, url_params.account_email, 'master_private_key');
    var prv = openpgp.key.readArmored(armored_private_key).keys[0];
    openpgp_key_encrypt(prv, new_passphrase);
    private_storage_set(localStorage, url_params.account_email, 'master_passphrase', new_passphrase);
    private_storage_set(localStorage, url_params.account_email, 'master_passphrase_needed', true);
    private_storage_set(localStorage, url_params.account_email, 'master_private_key', prv.armor());
    backup_key_on_gmail(url_params.account_email, prv.armor(), function(error_message) {
      $(self).html(btn_text);
      alert(error_message);
    });
  }
}));

function is_master_private_key_encrypted(account_email) {
  if(private_storage_get(localStorage, account_email, 'master_passphrase_needed') !== true) {
    return false;
  } else {
    var key = openpgp.key.readArmored(private_storage_get(localStorage, account_email, 'master_private_key')).keys[0];
    return key.primaryKey.isDecrypted === false && key.decrypt('') === false;
  }
}

function backup_on_gmail() {
  if(!is_master_private_key_encrypted(url_params.account_email)) {
    alert('Sorry, cannot back up private key because it\'s not protected with a pass phrase.');
  } else {
    var btn_text = $(self).text();
    $(self).html(get_spinner());
    var armored_private_key = private_storage_get(localStorage, url_params.account_email, 'master_private_key');
    backup_key_on_gmail(url_params.account_email, armored_private_key, function(error_message) {
      $(self).html(btn_text);
      alert(error_message);
    });
  }
}

function backup_as_file() { //todo - add a non-encrypted download option
  if(!is_master_private_key_encrypted(url_params.account_email)) {
    alert('Sorry, cannot back up private key because it\'s not protected with a pass phrase.');
  } else {
    var btn_text = $(self).text();
    $(self).html(get_spinner());
    var armored_private_key = private_storage_get(localStorage, url_params.account_email, 'master_private_key');
    download_file('cryptup-' + url_params.account_email.toLowerCase().replace(/[^a-z0-9]/g, '') + '.key', 'text/plain', armored_private_key);
    write_backup_done_and_render(false, 'file');
  }
}

function backup_by_print() { //todo - implement + add a non-encrypted print option
  throw 'not implemented';
}

function backup_refused() {
  write_backup_done_and_render(get_future_timestamp_in_months(6), 'none');
}

function write_backup_done_and_render(prompt, method) {
  account_storage_set(url_params.account_email, {
    key_backup_prompt: prompt,
    key_backup_method: method,
  }, function() {
    if(url_params.action === 'setup') {
      window.location = 'setup.htm?account_email=' + encodeURIComponent(url_params.account_email);
    } else {
      show_status();
    }
  });
}

$('.action_manual_backup').click(prevent(doubleclick(), function(self) {
  var selected = $('input[type=radio][name=input_backup_choice]:checked').val();
  if(selected === 'gmail') {
    backup_on_gmail();
  } else if(selected === 'file') {
    backup_as_file();
  } else if(selected === 'print') {
    backup_by_print();
  } else {
    backup_refused();
  }
}));

$('.action_skip_backup').click(prevent(doubleclick(), function() {
  account_storage_set(url_params.account_email, {
    key_backup_prompt: false
  }, function() {
    window.location = '/chrome/setup/setup.htm?account_email=' + encodeURIComponent(url_params.account_email);
  });
}));

$('#step_3_manual input[name=input_backup_choice]').click(function() {
  if($(this).val() === 'gmail') {
    $('.action_manual_backup').text('back up on gmail');
    $('.action_manual_backup').removeClass('red').addClass('green');
  } else if($(this).val() === 'file') {
    $('.action_manual_backup').text('back up as a file');
    $('.action_manual_backup').removeClass('red').addClass('green');
  } else if($(this).val() === 'print') {
    $('.action_manual_backup').text('back up on paper');
    $('.action_manual_backup').removeClass('red').addClass('green');
  } else {
    $('.action_manual_backup').text('test my luck without a backup');
    $('.action_manual_backup').removeClass('green').addClass('red');
  }
});