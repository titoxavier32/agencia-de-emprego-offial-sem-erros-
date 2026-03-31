const { execFile } = require('child_process');
const Setting = require('../models/Setting');

const getMailConfig = async () => {
  let setting = null;

  try {
    setting = await Setting.findOne();
  } catch (error) {
    setting = null;
  }

  return {
    host: (setting && setting.smtpHost) || process.env.SMTP_HOST || '',
    port: Number((setting && setting.smtpPort) || process.env.SMTP_PORT || 587),
    from: (setting && setting.smtpFrom) || process.env.SMTP_FROM || '',
    user: (setting && setting.smtpUser) || process.env.SMTP_USER || '',
    pass: (setting && setting.smtpPass) || process.env.SMTP_PASS || '',
    encryption: String((setting && setting.smtpEncryption) || process.env.SMTP_ENCRYPTION || 'tls').toLowerCase()
  };
};

const getMissingSmtpKeys = (config) => {
  const requiredKeys = [
    ['SMTP_HOST', config.host],
    ['SMTP_PORT', config.port],
    ['SMTP_FROM', config.from],
    ['SMTP_USER', config.user],
    ['SMTP_PASS', config.pass]
  ];

  return requiredKeys.filter(([, value]) => !value).map(([key]) => key);
};

const escapePowerShell = (value) => String(value || '').replace(/'/g, "''");

const sendMail = async ({ to, subject, html, text }) => {
  const config = await getMailConfig();
  const missing = getMissingSmtpKeys(config);

  if (missing.length) {
    throw new Error('Serviço de e-mail não configurado. Variáveis ausentes: ' + missing.join(', '));
  }

  const useSsl = config.encryption === 'ssl' || Number(config.port) === 465;
  const script =
    "$securePass = ConvertTo-SecureString '" + escapePowerShell(config.pass) + "' -AsPlainText -Force\n" +
    "$credential = New-Object System.Management.Automation.PSCredential ('" + escapePowerShell(config.user) + "', $securePass)\n" +
    "Send-MailMessage -From '" + escapePowerShell(config.from) + "' -To '" + escapePowerShell(to) + "' -Subject '" + escapePowerShell(subject) + "' -Body '" + escapePowerShell(html || text) + "' -BodyAsHtml -SmtpServer '" + escapePowerShell(config.host) + "' -Port " + Number(config.port || 587) + (useSsl ? " -UseSsl" : '') + " -Credential $credential";

  return new Promise((resolve, reject) => {
    execFile('powershell.exe', ['-NoProfile', '-Command', script], { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(stderr || stdout || error.message));
      }
      return resolve({ ok: true });
    });
  });
};

module.exports = {
  getMailConfig,
  getMissingSmtpKeys,
  sendMail
};
