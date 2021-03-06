import { TestWithBrowser, TestWithGlobalBrowser } from '..';
import { PageRecipe, SettingsPageRecipe } from '../page_recipe';
import { Url } from '../../browser';
import * as ava from 'ava';
import { Util, Config } from '../../util';
import { expect } from 'chai';

export let define_settings_tests = (test_with_new_browser: TestWithBrowser, test_with_semaphored_global_browser: TestWithGlobalBrowser) => {

  ava.test('settings[global] - my own emails show as contacts', test_with_semaphored_global_browser('compatibility', async (browser, t) => {
    let settings_page = await browser.new_page(Url.extension_settings('flowcrypt.compatibility@gmail.com'));
    await SettingsPageRecipe.toggle_screen(settings_page, 'additional');
    let contacts_frame = await SettingsPageRecipe.await_new_page_frame(settings_page, '@action-open-contacts-page' , ['contacts.htm', 'placement=settings']);
    await contacts_frame.wait_all('@page-contacts');
    await Util.sleep(1);
    expect(await contacts_frame.read('@page-contacts')).to.contain('flowcrypt.compatibility@gmail.com');
    expect(await contacts_frame.read('@page-contacts')).to.contain('flowcryptcompatibility@gmail.com');
    await SettingsPageRecipe.close_dialog(settings_page);
    await SettingsPageRecipe.toggle_screen(settings_page, 'basic');
  }));

  ava.test('settings[global] - attester shows my emails', test_with_semaphored_global_browser('compatibility', async (browser, t) => {
    let settings_page = await browser.new_page(Url.extension_settings('flowcrypt.compatibility@gmail.com'));
    await SettingsPageRecipe.toggle_screen(settings_page, 'additional');
    let attester_frame = await SettingsPageRecipe.await_new_page_frame(settings_page, '@action-open-attester-page' , ['keyserver.htm', 'placement=settings']);
    await attester_frame.wait_all('@page-attester');
    await Util.sleep(1);
    await attester_frame.wait_till_gone('@spinner');
    await Util.sleep(1);
    expect(await attester_frame.read('@page-attester')).to.contain('flowcrypt.compatibility@gmail.com');
    expect(await attester_frame.read('@page-attester')).to.contain('flowcryptcompatibility@gmail.com');
    await SettingsPageRecipe.close_dialog(settings_page);
    await SettingsPageRecipe.toggle_screen(settings_page, 'basic');
  }));

  ava.test('settings[global] - verify key presense 1pp1', test_with_semaphored_global_browser('compatibility', async (browser, t) => {
    let settings_page = await browser.new_page(Url.extension_settings('flowcrypt.compatibility@gmail.com'));
    await SettingsPageRecipe.verify_my_key_page(settings_page, 'flowcrypt.compatibility.1pp1', 'button');
  }));

  ava.test('settings[global] - test pass phrase', test_with_semaphored_global_browser('compatibility', async (browser, t) => {
    let settings_page = await browser.new_page(Url.extension_settings('flowcrypt.compatibility@gmail.com'));
    await SettingsPageRecipe.pass_phrase_test(settings_page, Config.key('flowcrypt.wrong.passphrase').passphrase, false);
    await SettingsPageRecipe.pass_phrase_test(settings_page, Config.key('flowcrypt.compatibility.1pp1').passphrase, true);
  }));

  ava.test.todo('settings - verify 2pp1 key presense');
  // await tests.settings_my_key_tests(settings_page, 'flowcrypt.compatibility.2pp1', 'link');

  ava.test('settings[global] - feedback form', test_with_semaphored_global_browser('compatibility', async (browser, t) => {
    let settings_page = await browser.new_page(Url.extension_settings('flowcrypt.compatibility@gmail.com'));
    await settings_page.wait_and_click('@action-open-modules-help');
    await settings_page.wait_all('@dialog');
    let help_frame = await settings_page.get_frame(['help.htm']);
    await help_frame.wait_and_type('@input-feedback-message', 'automated puppeteer test: help form from settings footer');
    let dialog = await settings_page.trigger_and_await_new_alert(() => help_frame.wait_and_click('@action-feedback-send'));
    await dialog.accept();
  }));

  ava.test('settings[global] - view contact public key', test_with_semaphored_global_browser('compatibility', async (browser, t) => {
    let settings_page = await browser.new_page(Url.extension_settings('flowcrypt.compatibility@gmail.com'));
    await SettingsPageRecipe.toggle_screen(settings_page, 'additional');
    let contacts_frame = await SettingsPageRecipe.await_new_page_frame(settings_page, '@action-open-contacts-page' , ['contacts.htm', 'placement=settings']);
    await contacts_frame.wait_all('@page-contacts');
    await Util.sleep(1);
    await contacts_frame.wait_and_click('@action-show-pubkey', {confirm_gone: true});
    await Util.sleep(1);
    expect(await contacts_frame.read('@page-contacts')).to.contain('flowcrypt.compatibility@gmail.com');
    expect(await contacts_frame.read('@page-contacts')).to.contain('LEMON VIABLE BEST MULE TUNA COUNTRY');
    expect(await contacts_frame.read('@page-contacts')).to.contain('5520CACE2CB61EA713E5B0057FDE685548AEA788');
    expect(await contacts_frame.read('@page-contacts')).to.contain('-----BEGIN PGP PUBLIC KEY BLOCK-----');
    await contacts_frame.wait_and_click('@action-back-to-contact-list', {confirm_gone: true});
    await Util.sleep(1);
    expect(await contacts_frame.read('@page-contacts')).to.contain('flowcrypt.compatibility@gmail.com');
    expect(await contacts_frame.read('@page-contacts')).to.contain('flowcryptcompatibility@gmail.com');
    await SettingsPageRecipe.close_dialog(settings_page);
    await SettingsPageRecipe.toggle_screen(settings_page, 'basic');
  }));

  ava.test('settings[global] - my key page - primary + secondary', test_with_semaphored_global_browser('compatibility', async (browser, t) => {
    let settings_page = await browser.new_page(Url.extension_settings('flowcrypt.compatibility@gmail.com'));
    await SettingsPageRecipe.verify_my_key_page(settings_page, 'flowcrypt.compatibility.1pp1', 'link', 0);
    await SettingsPageRecipe.verify_my_key_page(settings_page, 'flowcrypt.compatibility.2pp1', 'link', 1);
  }));

  ava.test.todo('settings - edit contact public key');

};
