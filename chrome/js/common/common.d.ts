

interface BrowserWidnow extends Window {
    XMLHttpRequest: any,
    onunhandledrejection: (e: any) => void,
}

type DbContactFilter = { has_pgp?: boolean, substring?: string, limit?: number }

interface FlowCryptWindow extends BrowserWidnow {
    jQuery: JQuery,
    $: JQuery,
    flowcrypt_attach: {
        init: Function,
    },
    iso88592: any,
    is_bare_engine: boolean,
    openpgp: any,
    flowcrypt_account: any,
    mnemonic: (hex: string) => string,
}

interface ContentScriptWindow extends FlowCryptWindow {
    TrySetDestroyableTimeout: (code: Function, ms: number) => number,
    TrySetDestroyableInterval: (code: Function, ms: number) => number,
    injected: true; // background script will use this to test if scripts were already injected, and inject if not
    account_email_global: null|string; // used by background script
    same_world_global: true; // used by background_script
    destruction_event: string;
    destroyable_class: string;
    reloadable_class: string;
    destroyable_intervals: number[];
    destroyable_timeouts: number[];
    destroy: () => void,
    vacant: () => boolean;
}

interface FlowCryptManifest {
    oauth2: {client_id:string, url_code:string, url_tokens:string, url_redirect:string, state_header:string, scopes:string[]},
}
  
interface SelectorCacher {
    cached: (name: string) => JQuery,
    now: (name: string) => JQuery,
}

interface Contact {
    email: string,
    name: string | null,
    pubkey: string | null,
    has_pgp: 0|1,
    searchable: string[],
    client: string | null,
    attested: boolean | null,
    fingerprint: string | null,
    longid: string | null,
    keywords: string | null,
    pending_lookup: number,
    last_use: number | null,
    date: number | null, // todo - should be removed. email provider search seems to return this?
}

interface ContactUpdate {
    email?: string,
    name?: string | null,
    pubkey?: string,
    has_pgp?: 0|1,
    searchable?: string[],
    client?: string | null,
    attested?: boolean | null,
    fingerprint?: string | null,
    longid?: string | null,
    keywords?: string | null,
    pending_lookup?: number,
    last_use?: number | null,
    date?: number | null, // todo - should be removed. email provider search seems to return this?
}

interface Attachment {
    name: string, 
    type: string, 
    content?: string|Uint8Array|null,
    data?: string, // todo - deprecate this - only use content
    size: number,
    url?: string|null,
    inline?: boolean,
    message_id?: string,
    treat_as?: 'hidden'|'signature'|'message'|'encrypted'|'public_key'|'standard',
    id?: string,
}

interface FromToHeaders {
    from: string,
    to: string[],
}

interface PubkeySearchResult {
    email: string,
    pubkey: string|null,
    has_pgp: boolean|null,
    client: string|null, // todo - really?
    attested: boolean|null,
    has_cryptup: boolean|null,
}

interface Challenge {
    question?: string,
    answer: string,
}

interface Dict<T> {
    [key: string]: T;
}

type FlatHeaders = Dict<string>;
type RichHeaders = Dict<string|string[]>;


interface PreventableEvent {
    name: 'double'|'parallel'|'spree'|'slowspree'|'veryslowspree',
    id: string,
}

interface OpenpgpDecryptResult {
    data: string|Uint8Array,
    filename?: string,
}

interface DecryptedErrorCounts {
    decrypted: number,
    potentially_matching_keys: number,
    rounds: number,
    attempts: number,
    key_mismatch: number,
    wrong_password: number,
    unsecure_mdc: number,
    format_errors: number,
}

interface Decrypted {
}

interface DecryptSuccess extends Decrypted {
    success: true,
    content: OpenpgpDecryptResult,
    signature: MessageVerifyResult|null,
    encrypted: boolean|null,
}

interface DecryptError extends Decrypted {
    success: false,
    counts: DecryptedErrorCounts, 
    unsecure_mdc?: boolean,
    errors: string[],
    missing_passphrases?: string[],
    format_error?: string,
    encrypted: null|boolean,
    encrypted_for?: string[],
    signature: null,
    message?: OpenpgpMessage,
}

interface OpenpgpEncryptResult {
    data: string|Uint8Array,
    message: {
        packets: {
            write: () => Uint8Array,
        }
    },
}

type NamedFunctionsObject = Dict<(...args: any[]) => any>;
type UrlParam = string|number|null|undefined|boolean|string[];
type UrlParams = Dict<UrlParam>;

interface KeyInfo {
    public: string,
    private: string,
    fingerprint: string,
    longid: string,
    primary: boolean,
    decrypted?: OpenpgpKey,
    keywords: string,
}

interface MimeContent {
    headers: FlatHeaders,
    attachments: Attachment[],
    signature: string|undefined,
    html: string|undefined,
    text: string|undefined,
}

type StoredAuthInfo = {account_email: string|null, uuid: string|null, verified: boolean|null};

interface MimeAsHeadersAndBlocks {
    headers: FlatHeaders,
    blocks: MessageBlock[],
}

type MessageBlockType = 'text'|'public_key'|'private_key'|'attest_packet'|'cryptup_verification'|'signed_message'|'message'|'password_message';

interface MessageBlock {
    type: MessageBlockType, 
    content: string, 
    complete: boolean,
    signature?: string,
}

interface MimeParserNode {
    path: string[],
    headers: {
        [key: string]: {value: string}[],
    },
    rawContent: string,
    content: Uint8Array,
    appendChild: (child: MimeParserNode) => void,
}

interface OpenpgpKey {
    primaryKey: any,
    getEncryptionKeyPacket: () => any|null,
    verifyPrimaryKey: () => number,
    subKeys: any[],
    decrypt: (pp: string) => boolean,
    armor: () => string,
    isPrivate: () => boolean,
    toPublic: () => OpenpgpKey,
    getAllKeyPackets: () => any[],
    getSigningKeyPacket: () => any,
    users:  Dict<any>[],
}

interface OpenpgpMessage {
    getEncryptionKeyIds: () => string[],
    getSigningKeyIds: () => string[],
    text?: string,
}

interface MessageVerifyResult {
    signer: string|null,
    contact: Contact|null,
    match: boolean|null, 
    error: null|string,
}

interface InternalSortedKeysForDecrypt {
    verification_contacts: Contact[],
    for_verification: OpenpgpKey[],
    encrypted_for: string[],
    signed_by: string[],
    potentially_matching: KeyInfo[],
    with_passphrases: KeyInfo[],
    without_passphrases: KeyInfo[],
}

interface SendableMessageBody {
    [key: string]: string|undefined,
    'text/plain'?: string,
    'text/html'?: string,
}

interface SendableMessage {
    headers: FlatHeaders,
    from: string,
    to: string[],
    subject: string,
    body: SendableMessageBody,
    attachments: Attachment[],
    thread: string|null,
}

interface StandardError {
    internal: string|null,
    message: string,
    code: number|null,
}

interface AuthRequest {
    tab_id?: string,
    account_email: string,
    scopes?: string[],
    message_id?: string,
    auth_responder_id?: string,
    omit_read_scope?: boolean,
}

type KeyBackupMethod = 'file'|'inbox'|'none'|'print';
type WebMailName = 'gmail'|'outlook'|'inbox'|'settings';
type PassphraseDialogType = 'embedded'|'sign'|'attest';
type Placement = 'settings'|'settings_compose'|'default'|'dialog'|'gmail'|'embedded'|'compose';
type FlatTypes = null|undefined|number|string|boolean;
type SerializableTypes = FlatTypes|string[]|number[]|boolean[]|SubscriptionInfo;
type Serializable = SerializableTypes|SerializableTypes[]|Dict<SerializableTypes>|Dict<SerializableTypes>[];
type Callback = (r?: any) => void;
type BrowserMessageHandler = (request: Dict<any>|null, sender: chrome.runtime.MessageSender|'background', respond: Callback) => void;
type EncryptDecryptOutputFormat = 'utf8'|'binary';
type Options = Dict<any>;

type LongidToMnemonic = (longid: string) => string;
type FlowCryptApiAuthToken = {account: string, token: string};
type FlowCryptApiAuthMethods = 'uuid'|FlowCryptApiAuthToken|null;
type ApiCallback = (ok: boolean, result: Dict<any>|string|null) => void;

type PaymentMethod = 'stripe'|'group'|'trial';
type ProductLevel = 'pro'|null;
type Product = {id: null|string, method: null|PaymentMethod, name: null|string, level: ProductLevel};
type ApiCallFormat = 'JSON'|'FORM';
type ApiCallProgressCallback = (percent: number|null, loaded: number|null, total: number|null) => void;
type ApiCallProgressCallbacks = {upload?: ApiCallProgressCallback, download?: ApiCallProgressCallback};
type ApiCallMethod = 'POST'|'GET'|'DELETE'|'PUT';
type ApiResponseFormat = 'json';
type GmailApiResponseFormat = 'raw'|'full'|'metadata';
type NamedSelectors = Dict<JQuery<HTMLElement>>;
type SelectorCache = {
    cached: (name: string) => JQuery<HTMLElement>,
    now: (name: string) => JQuery<HTMLElement>,
    selector: (name: string) => string,
}
type StorageType = 'session'|'local';
type EmailProvider = 'gmail';
type ProviderContactsQuery = { substring: string };

// specific api results
type ApirFcMessageLink = {expire: string, deleted: boolean, url: string, expired: boolean};
type ApirFcAccountUpdate$result = {alias: string, email: string, intro: string, name: string, photo: string}
type ApirFcAccountUpdate = {result: ApirFcAccountUpdate$result}

type WebmailVariantObject = {new_data_layer: null|boolean, new_ui: null|boolean, email: null|string, gmail_variant: WebmailVariantString}
type WebmailVariantString = null|'html'|'standard'|'new';
type WebmailSpecificInfo = {
    name: WebMailName,
    variant: WebmailVariantString,
    get_user_account_email: () => string|undefined,
    get_user_full_name: () => string|undefined,
    get_replacer: () => WebmailElementReplacer,
    start: (account_email: string, inject: Injector, notifications: Notifications, factory: Factory, notify_murdered: Callback) => void,
}
interface WebmailElementReplacer {
    everything: () => void,
    set_reply_box_editable: () => void,
    reinsert_reply_box: (subject: string, my_email: string, reply_to: string[], thread_id: string) => void,
}
type NotificationWithCallbacks = {notification: string, callbacks: Dict<Callback>};

interface JQueryStatic {
    featherlight: Function,
}

interface JQuery {
    featherlight: Function,
}

type AttachLimits = {count?: number, size?: number, size_mb?: number, oversize?: (new_file_size: number) => void}

type PromiseFactory<T> = () => T | PromiseLike<T>;

interface PromiseConstructor {
    sequence<T>(promise_factories: PromiseFactory<T>[]): Promise<T[]>;
}

// interface Promise<T> {
//     done<T>(callback: (success: boolean, result: T) => void): void;
//     validate<T>(validator: (result: T) => boolean): Promise<T>;
// }

interface SubscriptionInfo {
    active: boolean|null;
    method: PaymentMethod|null;
    level: 'pro'|null;
}

interface SubscriptionAttempt extends Product {
    source: string;
}

type GoogleAuthTokensResponse = {access_token: string, expires_in: number, refresh_token?: string};
type AjaxError = {request: JQuery.jqXHR<any>, status: JQuery.Ajax.ErrorTextStatus, error: string};

type StoredReplyDraftMeta = string; // draft_id
type StoredComposeDraftMeta = {recipients: string[], subject: string, date: number}
type StoredAdminCode = {date: number, codes: string[]};
type StoredAttestLog = {attempt: number, packet?: string, success: boolean, result: string};
type Storable = FlatTypes|string[]|KeyInfo[]|Dict<StoredReplyDraftMeta>|Dict<StoredComposeDraftMeta>|Dict<StoredAdminCode>|SubscriptionAttempt|SubscriptionInfo|StoredAttestLog[];

interface RawStored {
    [key: string]: Storable;
}

interface Stored {
    [key: string]: Storable;

    // global
    version?: number|null;
    keys?: KeyInfo[];
    account_emails?: string; // stringified array
    errors?: string[];
    settings_seen?: boolean;
    hide_pass_phrases?: boolean;
    cryptup_account_email?: string;
    cryptup_account_uuid?: string;
    cryptup_account_subscription?: SubscriptionInfo;
    cryptup_account_verified?: boolean;
    dev_outlook_allow?: boolean;
    cryptup_subscription_attempt?: SubscriptionAttempt;
    admin_codes?: Dict<StoredAdminCode>;
    attest_log?: StoredAttestLog[];
    
    // per account
    notification_setup_needed_dismissed?: boolean;
    email_provider?: EmailProvider;
    google_token_access?: string;
    google_token_expires?: number;
    google_token_scopes?: string[];
    hide_message_password?: boolean; // is global?
    addresses?: string[];
    addresses_pks?: string[];
    addresses_keyserver?: string[];
    email_footer?: string|null;
    drafts_reply?: Dict<StoredReplyDraftMeta>;
    drafts_compose?: Dict<StoredComposeDraftMeta>;
    pubkey_sent_to?: string[];
    full_name?: string;
    cryptup_enabled?: boolean;
    setup_done?: boolean;
    setup_simple?: boolean;
    key_backup_method?: KeyBackupMethod;
    attests_requested?: string[]; // attester names
    attests_processed?: string[]; // attester names
    key_backup_prompt?: number|false;
    successfully_received_at_leat_one_message?: boolean;
    notification_setup_done_seen?: boolean;
}