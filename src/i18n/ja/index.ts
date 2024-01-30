import type { Translation } from '../i18n-types';

const ja: Translation = {
    serverTitle: 'レインサーバー',
    footerText: 'レインサーバーは、株式会社カプコンまたはその子会社とは一切関係ありません。<br>本コミュニティは多数のボランティアによる協力の下で成り立っており、いかなる収益も発生いたしません。',
    captchaText:
        'このサイトはCloudflare Turnstileで保護されており、Cloudflare社の<a target="_blank" rel="noopener noreferrer" href="https://www.cloudflare.com/privacypolicy/" style="text-decoration: underline; color: #32d9f3;">プライバシーポリシー</a>と<a target="_blank" rel="noopener noreferrer" href="https://www.cloudflare.com/website-terms/" style="text-decoration: underline; color: #32d9f3;">利用規約</a>が適用されます。',

    // Header Language Selection
    header: {
        currentLang: '日本語',
        langSelectArea: {
            ja: {
                mainName: '日本語',
                subName: '日本語',
            },
            en: {
                mainName: 'English',
                subName: '英語',
            },
        },
    },

    // Register Page
    register: {
        metaTitle: '無料会員登録',
        metaDesc: 'レインサーバー版「モンスターハンター フロンティア オンライン」の会員登録ページです。',
        title: 'アカウント作成',
        stage1Text: ['ユーザー名<span>（6文字以上20文字以下の半角英数字のみ可）</span>', 'パスワード<span>（10文字以上32文字以下のみ可）</span>', '確認用パスワード', 'パスワード強度'],
        stage1Btn: '登録',
        stage2Text:
            '<p>登録はまだ完了していません。<br>下記「遷移」ボタンを押下してディスコード認証ページへ遷移し、ディスコードとのアカウント連携を完了してください。</p><p style="color: #ff1e1e;">※アカウント連携には、レインサーバー公式ディスコードに参加している必要があります。参加は<a style="text-decoration: underline;" href="https://discord.gg/TcpkpUpeGw" target="_blank" rel="noopener noreferrer">こちら</a>から行えます。</p>',
        stage2Btn: '遷移',
        stage1_1Text:
            '<p>認証コードをダイレクトメッセージへ送信しました。<br />コードを確認したうえで、入力ページへ進んでください。</p><p style="color: #ff1e1e;">※本手続きは、これより{min}分以内に完了させてください。</p>',
        passwordStrength: ['非常に弱い', '弱い', '標準', '強い'],
        passwordStrengthList: [
            'パスワードは、下記項目をそれぞれ満たす必要があります。',
            '10文字以上32文字以下',
            '小文字（a ～ z）および大文字（A ～ Z）を含む。',
            '少なくとも１つの数字（0 ～ 9）を含む。',
            '少なくとも１つの記号（{symbol}）を含む。',
        ],
        haveAccount: '既にアカウントをお持ちの場合',
        doneRegister: 'アカウント作成およびディスコード連携が<br>正常に完了しました。<br>このページは閉じても構いません。',
        userExist: '既に存在するユーザーです。',
        invUsername: 'ユーザー名を正しく入力してください。',
        invUsernameChar: 'ユーザー名には6文字以上20文字以下の英数字（A ～ Z／a ～ z／0 ～ 9）のみが使用できます。',
        invPassword: 'パスワードを正しく入力してください。',
        invalidPasswordStrength: 'パスワードは強度が「強い」かつ10文字以上32文字以下である必要があります。',
        invConfPassword: 'パスワードと確認用パスワードが一致しません。',
    },

    // Log In Page
    login: {
        title: 'ログイン',
        metaDesc: 'レインサーバー版「モンスターハンター フロンティア オンライン」のログインページです。',
        usernameLabel: 'ユーザー名',
        passwordLabel: 'パスワード',
        rememberMe: 'ログイン情報を保存する',
        forgotPassword: 'パスワードを忘れたら',
        notRegister: 'アカウントをお持ちでない場合',
        buttonLabel: 'ログイン',
        noUser: '入力されたユーザー名のアカウントが存在しません。',
        incPassword: 'パスワードが正しくありません。',
        captchaInProg: 'キャプチャ認証中... しばらくお待ちください。',
    },

    // Reset Password Page
    resetPassword: {
        metaTitle: 'パスワードを忘れたら',
        metaDesc: 'レインサーバー版「モンスターハンター フロンティア オンライン」のパスワード再設定ページです。パスワードを紛失された場合は、このページから新しいパスワードを再設定できます。',
        title: 'パスワード再設定',
        stage1Btn: '確認',
        stage2Text: '認証コード入力欄',
        stage2Btn: '認証',
        stage3Text: ['ユーザー名', '新しいパスワード<span>（10文字以上32文字以下のみ可）</span>', '確認用パスワード'],
        stage3Btn: '再設定',
        doneReset: 'パスワードの再設定が正常に完了しました。<br>新たなパスワードでログイン可能です。',
        codeNotMatch: 'コードが一致しません。',
        verifCodeDesc:
            '以下の認証コードを入力して、手続きを完了してください。\n「{site}」サイトへのアクセスは、本コード発行直後から{time}分間有効です。また、タブを閉じるまたはページを更新した場合はアクセスできなくなります。',
    },

    // Link Discord Page
    linkDiscord: {
        metaTitle: 'ディスコードアカウント連携',
        metaDesc: 'レインサーバー版「モンスターハンター フロンティア オンライン」のアカウント連携ページです。ご利用中のディスコードアカウントとゲームアカウントを連携することができます。',
        title: 'アカウント連携',
        stage3Btn: '次へ',
        discordUserIDLabel: 'ユーザーID（ディスコード）',
        discordUsernameLabel: 'ユーザー名（ディスコード）',
        characterName: '連携するキャラクターを選択',
        opitonText: ['HR：', 'GR：', '武器種：'],
        doneLinkDiscord: 'ディスコードアカウントの連携が正常に完了しました。<br>このページは閉じても構いません。',
        buttonLabel: '連携',
        discordLabel: 'ディスコード',
        frontierLabel: 'フロンティア',
        existLinkedChar: 'このキャラクターは既に連携されています。',
        userLinked: 'このユーザーアカウントは、既に他のディスコードアカウントと連携されています。',
    },

    // Maintenance Page
    maintenance: {
        title: 'メンテナンス中',
        message1: '現在メンテナンス中のため、サイトへアクセスすることができません。',
        message2: '終了予定時刻：',
        message3: 'メンテナンス終了までしばらくお待ちくださいますようお願いいたします。',
    },

    // Error Page
    error: {
        unexpectedErr: '予期せぬエラー',
        otherMessage1: '次のような理由により、ページ内でエラーが発生しました。',
        otherMessage2: '理由不明。',
        noUserData: 'ユーザーアカウントが見つからない。',
        startOverMsg3: '最初からやり直してください。',
        unauthOps: '不正な操作を検知',
        invalidCaptcha: 'キャプチャが無効です。再度やり直してください。',
        failedApiMsg1: '次のような理由により、レインAPIとの通信に失敗しました。',
        noPreRegData: '一時保存データが存在しない。',
        sessionExpired: 'セッションの有効期限が切れている。',
        paramsUndefined: 'パラメータが未定義。',
        passedInvalidData: '無効なデータが渡された。',

        400: {
            title: '不正なリクエスト',
            message1: '次のような理由により、リクエストの処理に失敗しました。',
        },

        401: {
            title: '認証失敗',
        },

        403: {
            title: 'アクセスが拒否されました',
            message1: 'このページへのアクセスは、次のような理由により許可されていません。',
            message2: ['アクセスしているユーザーがレインサーバーの管理者ではない。'],
            message3: 'ウェブサイトに関して不具合等を発見された方は、レインチームまでご報告ください。',
        },

        404: {
            title: 'お探しのページが存在しません',
            message1: 'お探しのページは、次のような理由によりご覧になることができません。',
            message2: ['ページファイルが存在しない。', 'ページが移動、または削除されている。', 'URLに誤りがある、もしくは更新されている。'],
            message3: 'ウェブサイトに関して不具合等を発見された方は、レインチームまでご報告ください。',
        },

        422: {
            title: '処理不可能',
            message1: '次のような理由により、リクエストを処理できませんでした。',
        },

        500: {
            title: '内部エラー',
            message1: '次のような理由により、サーバー内部でエラーが発生しました。',
            message3: 'しばらくしてから、もう一度お試しください。',
        },

        oauth: {
            message1: '次のような理由により、ディスコードアカウントの認証に失敗しました。',
            noDataForAuth: '認証に必要なデータが存在しない。',
            noDataForAuthMsg3: '本サイトへのアクセスは、ディスコード認証を介してのみ可能です。',
            failedGetToken: 'ディスコードトークンの取得に失敗。',
            failedGetUser: '認証ユーザーのデータ取得に失敗。',
        },

        register: {
            failedRegisterMsg1: '次のような理由により、会員登録に失敗しました。',
        },

        login: {
            failedLoginMsg1: '次のような理由により、ログインに失敗しました。',
        },

        resetPassword: {
            failedResetMsg1: '次のような理由により、パスワードの再設定に失敗しました。',
            noLinkedUser: '認証時にログインしたディスコードと連携しているゲームアカウントが見つからない。',
            failedSendDM: '認証ユーザーへのダイレクトメッセージ送信に失敗。',
            failedSendDMMsg3:
                'ディスコード内設定「サーバーにいるメンバーからのダイレクトメッセージを許可する」を無効にしているか、<br>レインサーバー公式ディスコードへ参加していない可能性があります。',
        },

        linkDiscord: {
            failedLinkMsg1: '次のような理由により、ディスコードアカウントの連携に失敗しました。',
            notMatchPass: 'パスワードが一致しない。',
            existLinkedUser: '認証時にログインしたディスコードアカウントが、既存のゲームアカウントと既に連携している。',
            noCharacter: 'ユーザーアカウント内にキャラクター「{name}」が存在しない。',
            notJoinedDiscord: 'レインサーバー公式ディスコードに参加していない。',
            failedAddRole: '「Registered」ロールの追加に失敗。',
            failedAddRoleMsg3: '管理者向け：ボットの権限が正しいか確認してください。',
        },
    },
};

export default ja;
