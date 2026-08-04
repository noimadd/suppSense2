// Create a transporter using SMTP
const nodemailer = require("nodemailer");

export const EMAIL_TRANSPORTER = nodemailer.createTransport({
                                                                host: process.env.SMTP_SERVER,
                                                                port: 587,
                                                                secure: false, // use STARTTLS
                                                                auth: {
                                                                    user: process.env.SMTP_USER,
                                                                    pass: process.env.SMTP_PASS,
                                                                },
                                                            });

