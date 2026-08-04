import { randomUUID } from 'crypto';
import { redisClient } from '../db/redis';
import { EMAIL_TRANSPORTER } from '../middleware/email.middleware';

const DEFAULT_CODE_TTL = 60 * 10; // 10 mins

interface EmailVerificationData {
    email: string;
    c_code: string;
}

function EmailVerificationKey(user_email: string) {
    return `emailChallenge:${user_email}`;
}

// Todo(Leo): Return NULL if the user is being throttled so we know to throw an error back at them
export async function CreateEmailVerificationChallenge(email: string): Promise<{ challenge_code: string } | null>
{
    const raw_code = crypto.randomInt(0, 1000000);
    const code = raw_code.toString().padStart(6, '0');
    
    const data: EmailVerificationData = { email, code }; 
    
    await redisClient.set(EmailVerificationKey(email), JSON.stringify(data), {
                              EX: DEFAULT_CODE_TTL,
                          });
    
    return { code };
}

export async function GetEmailVerificationChallenge(email: string): Promise<EmailVerificationData | null>
{
    const data = await redisClient.get(EmailVerificationKey(email));
    return data ? JSON.parse(data) as SessionData : null;
}

export async function DeleteEmailVerificationChallenge(email: string): Promise<void>
{
    await redisClient.del(EmailVerificationKey(email));
}

export async function SendVerificationChallengeEmail(email: string, challenge_code: string)
{
    const email_info = await EMAIL_TRANSPORTER.sendMail({
                                                            from: '"SuppSense Team" <verify-no-reply@suppsense.leovdm.nz>',
                                                            to: email,
                                                            subject: "Verify your email address...",
                                                            text: "Here is your code to verify your email address. Copy it into the signup window to finish creating your account. " + challenge_code,
                                                            html: "<h1>Finish creating your account</h1>" + 
                                                                "<p>To finish creating your SuppSense account copy the below code into the signup page. If you did not request this email then please report it using <a href='google.com'>this link</a>" +
                                                                "<br>" + challenge_code,
                                                        });
    
}