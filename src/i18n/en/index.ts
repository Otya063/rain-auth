import type { BaseTranslation } from '../i18n-types';

const en: BaseTranslation = {
    serverTitle: 'Rain Server',
    footerText:
        'Rain Server is not affiliated with Capcom Co., Ltd. or any of its subsidiaries. <br>This community is based on the cooperation of numerous volunteers, and no revenue of any sort is generated through this community.',
    captchaText:
        'This site is protected by Cloudflare Turnstile and Cloudflare\'s <a target="_blank" rel="noopener noreferrer" href="https://www.cloudflare.com/privacypolicy/" style="text-decoration: underline; color: #32d9f3;">Privacy Policy</a> and <a target="_blank" rel="noopener noreferrer" href="https://www.cloudflare.com/website-terms/" style="text-decoration: underline; color: #32d9f3;">Terms of Service</a> apply.',

    // Header Language Selection
    header: {
        currentLang: 'English',
        langSelectArea: {
            ja: {
                mainName: '日本語',
                subName: 'Japanese',
            },
            en: {
                mainName: 'English',
                subName: 'English',
            },
        },
    },

    // Register Page
    register: {
        metaTitle: 'Register',
        metaDesc: 'This is the registration page for the Rain Server version of Monster Hunter Frontier Online.',
        title: 'Create an Account',
        stage1Text: ['Username <span>(6-20 charcters, may only contain alphanumeric characters)</span>', 'Password <span>(10-32 charcters)</span>', 'Confirm Password', 'Password Strength'],
        stage1Btn: 'Register',
        stage2Text:
            '</p>Registration has not been completed yet.<br>Click "Redirect" button below to move to the discord authorization page and complete the discord account linkage.</p><p style="color: #ff1e1e;">* To link your account, you must be a member of the official Rain Server discord. You can join <a style="text-decoration: underline;" href="https://discord.gg/TcpkpUpeGw" target="_blank" rel="noopener noreferrer">here</a>.',
        stage2Btn: 'Redirect',
        stage1_1Text:
            '<p>A verification code has been sent to your direct message.<br>Please confirm that you have received the code and proceed to the input page.</p><p style="color: #ff1e1e;">This procedure should be completed within {min: number} minutes of this.</p>',
        passwordStrength: ['Too Weak', 'Weak', 'Medium', 'Strong'],
        passwordStrengthList: [
            'Your password needs to:',
            'contain 10-32 characters.',
            'contain both lower (a-z) and upper case letters (A-Z).',
            'contain at least one number (0-9).',
            'contain at least one symbol ({symbol: string}).',
        ],
        haveAccount: 'Already have an account?',
        doneRegister: 'Account creation and discord account linkage has been successfully completed.<br>Feel free to close this browser window.',
        userExist: 'The user already exists.',
        invUsername: 'Enter your username correctly.',
        invUsernameChar: 'Your username may only contain alphanumeric characters. (6-20 charcters, A-Z, a-z, 0-9)',
        invPassword: 'Enter your password correctly.',
        invalidPasswordStrength: 'Your passwords must be "strong" and 10-32 characters.',
        invConfPassword: 'Your password and confirmation password must match.',
    },

    // Log In Page
    login: {
        title: 'Log In',
        metaDesc: 'This is the login page for the Rain Server version of Monster Hunter Frontier Online.',
        usernameLabel: 'Username',
        passwordLabel: 'Password',
        rememberMe: 'Remember Me',
        forgotPassword: 'Forgot Password?',
        notRegister: "Don't have an account?",
        buttonLabel: 'Log In',
        noUser: 'The account with the entered username does not exist.',
        incPassword: 'Password is incorrect.',
        captchaInProg: 'Captcha validation in progress... Please wait a moment.',
    },

    // Reset Password Page
    resetPassword: {
        metaTitle: 'Forgot Password',
        metaDesc: 'This is the password reset page for the Rain Server version of Monster Hunter Frontier Online. If you have lost your password, you can reset a new one from this page.',
        title: 'Reset Password',
        stage1Btn: 'Confirm',
        stage2Text: 'Verification Code Input Field',
        stage2Btn: 'Verify',
        stage3Text: ['Username', 'New Password <span>(10-32 charcters)</span>', 'Confirm New Password'],
        stage3Btn: 'Reset',
        doneReset: 'Your password has been successfully reset.<br>You can now log in with your new password.',
        codeNotMatch: 'The code does not match.',
        verifCodeDesc:
            'Please enter the following verification code to complete this procedure.\nAccess to the "{site: string}" site is valid for {time: number} minutes immediately after this code is issued. Also, if you close the tab or refresh the site, you will not be able to access the site.',
    },

    // Link Discord Page
    linkDiscord: {
        metaTitle: 'Discord Account Linkage',
        metaDesc: 'This is the account linkage page for the Rain Server version of Monster Hunter Frontier Online. You can link your discord account to your game account.',
        title: 'Account Linkage',
        stage3Btn: 'Next',
        discordUserIDLabel: 'User ID (Discord)',
        discordUsernameLabel: 'Username (Discord)',
        characterName: 'Select the Character to Be Linked',
        opitonText: ['HR: ', 'GR: ', 'Weapon Type: '],
        doneLinkDiscord: 'The discord account has been successfully linked.<br>Feel free to close this browser window.',
        buttonLabel: 'Link',
        discordLabel: 'Discord',
        frontierLabel: 'Frontier',
        existLinkedChar: 'This character has already been linked.',
        userLinked: 'This user account is already linked to another discord account.',
    },

    // Maintenance Page
    maintenance: {
        title: 'Under Maintenance',
        message1: 'This site is currently under maintenance and cannot be accessed.',
        message2: 'Maintenance will end on: ',
        message3: 'Please wait for a while until the end of maintenance is announced.',
    },

    // Error Page
    error: {
        unexpectedErr: 'Unexpected Error',
        otherMessage1: 'An error occurred in the page for the following reason:',
        otherMessage2: 'Reason unknown.',
        noUserData: 'A user account could not be found.',
        startOverMsg3: 'Please start the process over from the beginning.',
        unauthOps: 'Attempted to perform an unauthorized operation.',
        invalidCaptcha: 'Invalid capture. Please try again.',
        failedApiMsg1: 'Failed to communicate with Rain API for the following reason:',
        noPreRegData: 'No temporarily stored data exists.',
        sessionExpired: 'Your session may have expired.',
        paramsUndefined: 'Undefined parameters.',
        passedInvalidData: 'Invalid data was passed.',

        400: {
            title: 'Bad Request',
            message1: 'Failed to process the request for the following reasons:',
        },

        401: {
            title: 'Unauthorized',
        },

        403: {
            title: 'Forbidden',
            message1: 'You are not allowed to access this page for the following reason:',
            message2: ['The user accessing this page is not Rain Administrators.'],
            message3: 'If you find any problems with our website, please contact the Rain Team.',
        },

        404: {
            title: 'Not Found',
            message1: 'The requested page was not found for the following reason:',
            message2: ['The page file does not exist.', 'The page has been moved or deleted.', 'The URL was not correct or has been updated.'],
            message3: 'If you find any problems with our website, please contact the Rain Team.',
        },

        422: {
            title: 'Unprocessable Entity',
            message1: 'Failed to process the request for the following reasons:',
        },

        500: {
            title: 'Internal Error',
            message1: 'An error occurred inside the server for the following reasons:',
            message3: 'Please try again after a while.',
        },

        oauth: {
            message1: 'Failed to authorize your discord account for the following reasons:',
            noDataForAuth: 'The data required for authorization does not exist.',
            noDataForAuthMsg3: 'Access to this page is only possible via discord authorization.',
            failedGetToken: 'Failed to get discord token.',
            failedGetUser: 'Failed to get data for authorized user.',
        },

        register: {
            failedRegisterMsg1: 'Failed to register for the following reasons:',
            failedCreateUser: 'Failed to create user data for the following reasons:',
            failedCreateCharacter: 'Failed to create character data for the following reasons:',
        },

        login: {
            failedLoginMsg1: 'Failed to login for the following reasons:',
        },

        resetPassword: {
            failedResetMsg1: 'Failed to reset the password for the following reason:',
            noLinkedUser: 'The game account linked to your discord account you logged in to during authorization could not be found.',
            failedSendDM: 'Failed to send direct message to authorised user.',
            failedSendDMMsg3:
                'You may have disabled the setting "Allow direct messages from server members" within Privacy & Safety settings,<br>or you may not have joined the official Rain Server discord.',
        },

        linkDiscord: {
            failedLinkMsg1: 'Failed to link your discord account for the following reason:',
            notMatchPass: 'Password does not match.',
            existLinkedUser: 'Your discord account is already linked to the game account.',
            noCharacter: 'The character "{name: string}" does not exist in the user account.',
            notJoinedDiscord: 'You have not joined the official Rain Server discord.',
            failedAddRole: 'Failed to add "Registered" role.',
            failedAddRoleMsg3: "For administrators: check that the bot's permissions are correct.",
        },
    },
};

export default en;
