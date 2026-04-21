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
        private readonly ISmtpConfigurationService _smtpConfigService;
        private readonly ILogger<EmailService> _logger;

        public EmailService(ISmtpConfigurationService smtpConfigService, ILogger<EmailService> logger)
        {
            _smtpConfigService = smtpConfigService;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string body, byte[]? attachment = null, string? attachmentFileName = null)
        {
            // 1. Get configuration from the Database
            var dbConfig = await _smtpConfigService.GetActiveConfigurationAsync();
            
            if (dbConfig == null)
            {
                _logger.LogError("Failed to send email: No active SMTP configuration found.");
                throw new InvalidOperationException("No active SMTP configuration found in the database. Please configure email settings in the Admin panel.");
            }

            string host = dbConfig.Host;
            int port = dbConfig.Port;
            string username = dbConfig.Username;
            string password = dbConfig.EncryptedPassword; 
            string fromEmail = dbConfig.FromEmail;
            string fromName = dbConfig.FromName;

            _logger.LogInformation("Attempting to send email to {To} via {Host}", to, host);

            List<string> ccEmails = new List<string>();
            if (!string.IsNullOrEmpty(dbConfig.CCEmailsJson))
            {
                try {
                    ccEmails = System.Text.Json.JsonSerializer.Deserialize<List<string>>(dbConfig.CCEmailsJson) ?? new List<string>();
                } catch { /* Ignore malformed JSON */ }
            }
            
            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(fromName, fromEmail));
            email.To.Add(MailboxAddress.Parse(to));
            
            // Add CCs in a loop
            foreach (var cc in ccEmails)
            {
                if (!string.IsNullOrWhiteSpace(cc))
                {
                    email.Cc.Add(MailboxAddress.Parse(cc.Trim()));
                }
            }

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
            
            // Connect to the SMTP server using the fetched settings
            await smtp.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            
            // Authenticate using the fetched credentials
            if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
            {
                await smtp.AuthenticateAsync(username, password);
            }

            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
    }
}
