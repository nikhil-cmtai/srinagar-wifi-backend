import twilio from 'twilio';

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// In-memory OTP storage (use DB like Redis in production)
const otpStorage = new Map();

/**
 * 6 digit OTP generate karna
 * @returns {string} 6 digit OTP
 */
export const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * 6 digit OTP bhejna hai WhatsApp pe
 * @param {string} mobileNumber - International format number (e.g. +919876543210)
 * @returns {Promise<Object>} Twilio ka response
 */
export const sendOtp = async (mobileNumber) => {
    try {
        const otp = generateOtp();
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
        const expiryTime = Date.now() + expiryMinutes * 60 * 1000;

        // WhatsApp number format
        const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER
            ? `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`
            : `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;
        const whatsappTo = `whatsapp:${mobileNumber}`;

        const message = `Aapka Srinagar Airport WiFi OTP hai: *${otp}* . Yeh ${expiryMinutes} minute tak valid hai.`;

        const response = await twilioClient.messages.create({
            body: message,
            from: whatsappFrom,
            to: whatsappTo
        });

        otpStorage.set(mobileNumber, {
            otp: otp,
            expiresAt: expiryTime,
            attempts: 0
        });

        setTimeout(() => {
            otpStorage.delete(mobileNumber);
        }, expiryMinutes * 60 * 1000);

        return {
            success: true,
            messageSid: response.sid,
            status: response.status,
            otp: otp, // (aap isko remove kar sakte ho production me)
            message: "OTP WhatsApp pe bhej diya gaya hai"
        };
    } catch (error) {
        console.error('OTP bhejne me error:', error);
        return {
            success: false,
            error: error.message,
            message: "OTP bheja nahi gaya"
        };
    }
};

/**
 * 6 digit OTP verify karna hai
 * @param {string} mobileNumber - International format number (e.g. +919876543210)
 * @param {string} otp - User ka dala hua OTP
 * @returns {Object}
 */
export const verifyOtp = (mobileNumber, otp) => {
    try {
        const stored = otpStorage.get(mobileNumber);

        if (!stored) {
            return {
                success: false,
                message: 'OTP expired ya galat. Naya OTP mangwao.'
            };
        }

        if (Date.now() > stored.expiresAt) {
            otpStorage.delete(mobileNumber);
            return {
                success: false,
                message: 'OTP expire ho gaya. Naya OTP mangwao.'
            };
        }

        const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS) || 3;
        if (stored.attempts >= maxAttempts) {
            otpStorage.delete(mobileNumber);
            return {
                success: false,
                message: 'Maksimum attempts cross ho gaye. Naya OTP mangwao.'
            };
        }

        stored.attempts++;

        if (stored.otp === otp) {
            otpStorage.delete(mobileNumber);
            return {
                success: true,
                message: 'OTP sahi hai, verify ho gaya.'
            };
        } else {
            otpStorage.set(mobileNumber, stored);
            const remaining = maxAttempts - stored.attempts;
            return {
                success: false,
                message: `OTP galat hai. ${remaining > 0 ? `${remaining} attempt(s) bache hai.` : 'Naya OTP mangwao.'}`
            };
        }
    } catch (error) {
        console.error('OTP verify karte waqt error:', error);
        return {
            success: false,
            error: error.message,
            message: 'OTP verify nahi hua'
        };
    }
};