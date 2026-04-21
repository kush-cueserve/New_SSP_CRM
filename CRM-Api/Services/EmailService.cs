using CRM_Api.Services.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using System;
using System.IO;
using System.Threading.Tasks;

namespace CRM_Api.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string to, string subject, string body, byte[]? attachment = null, string? attachmentFileName = null)
        {
            var emailSettings = _config.GetSection("EmailSettings");
            
            var email = new MimeMessage();
            email.From.Add(MailboxAddress.Parse(emailSettings["From"]));
            email.To.Add(MailboxAddress.Parse(to));
            email.Subject = subject;

            var builder = new BodyBuilder();
            
            string styledHtmlBody = $@"
            <html>
            <body style='font-family: ""Helvetica Neue"", Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0;'>
                <table width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color: #f4f5f7; padding: 40px 20px;'>
                    <tr>
                        <td align='center'>
                            <table width='600' cellpadding='0' cellspacing='0' border='0' style='background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;'>
                                <!-- Header with Logo -->
                                <tr>
                                    <td align='center' style='padding: 30px 20px; background-color: #ffffff; border-bottom: 4px solid #0d9488;'>
                                        <img src='http://supersmartplans.com/wp-content/uploads/email/SSPLogo.jpg' alt='SuperSmartPlans' style='max-width: 250px; height: auto; display: block;' />
                                    </td>
                                </tr>
                                <!-- Body Content -->
                                <tr>
                                    <td style='padding: 40px 30px; font-size: 16px; line-height: 1.6; color: #374151;'>
                                        {body}
                                    </td>
                                </tr>
                                <!-- Footer -->
                                <tr>
                                    <td align='center' style='padding: 20px 30px; font-size: 13px; color: #6b7280; background-color: #f9fafb; border-top: 1px solid #e5e7eb;'>
                                        &copy; {DateTime.Now.Year} SuperSmartPlans Financial & Accounting.<br/>
                                        This is an automated message from the SSP CRM system.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>";

            builder.HtmlBody = styledHtmlBody;

            if (attachment != null && attachment.Length > 0)
            {
                builder.Attachments.Add(attachmentFileName ?? "document.pdf", attachment);
            }

            email.Body = builder.ToMessageBody();

            using var smtp = new SmtpClient();
            
            // Connect to the SMTP server
            var host = emailSettings["Host"];
            var port = int.Parse(emailSettings["Port"] ?? "587");
            
            await smtp.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            
            // Authenticate if needed
            var user = emailSettings["Username"];
            var pass = emailSettings["Password"];
            
            if (!string.IsNullOrEmpty(user) && !string.IsNullOrEmpty(pass))
            {
                await smtp.AuthenticateAsync(user, pass);
            }

            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
    }
}
