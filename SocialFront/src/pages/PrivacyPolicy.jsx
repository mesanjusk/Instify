import { useNavigate } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 10, borderLeft: '3px solid #059669', paddingLeft: 12 }}>
      {title}
    </h2>
    <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.8 }}>{children}</div>
  </div>
);

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '"Inter", -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #064e3b, #059669)', padding: '32px 24px 28px', color: '#fff' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginBottom: 20, fontFamily: 'inherit' }}>
          ← Back
        </button>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Privacy Policy</h1>
        <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: '0.85rem' }}>Instify — Institute Management System · Last updated: June 2025</p>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 24px 60px' }}>

        <Section title="1. Who We Are">
          <p>Instify ("we", "our", "us") is an Institute Management System (ERM) designed for educational institutes — coaching centres, schools, colleges, and training institutes. We are operated by Instify and reachable at <strong>https://instify-kfpm.onrender.com</strong>.</p>
        </Section>

        <Section title="2. What Data We Collect">
          <p>We collect the following categories of personal data from institute administrators and their staff:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li><strong>Institute data:</strong> Institute name, type, center code, mobile number, head name.</li>
            <li><strong>Staff / User data:</strong> Name, role, login credentials (hashed).</li>
            <li><strong>Student / Lead data:</strong> Full name, date of birth, gender, mobile numbers (student + parent), address, education background, Aadhaar number (optional), course enrollment, attendance, exam results, and fee payment history.</li>
            <li><strong>Financial data:</strong> Fee amounts, payment dates, payment modes, transaction history, UPI configurations.</li>
            <li><strong>Communication data:</strong> WhatsApp message logs sent via our platform (fee reminders, follow-ups, birthday wishes, OTPs).</li>
          </ul>
          <p style={{ marginTop: 8 }}>We do <strong>not</strong> collect device contacts, call logs, location, camera, or microphone data.</p>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul style={{ paddingLeft: 20 }}>
            <li>To operate and deliver the Instify ERM platform.</li>
            <li>To send OTP verification messages via WhatsApp during registration.</li>
            <li>To send automated WhatsApp notifications to students/parents (fee reminders, follow-up alerts, attendance updates, exam results, birthday wishes) — only when WhatsApp consent has been provided.</li>
            <li>To generate reports, ID cards, certificates, and financial statements for institute use.</li>
            <li>To provide customer support and platform improvements.</li>
          </ul>
        </Section>

        <Section title="4. WhatsApp Messaging & Consent">
          <p>Instify integrates with WhatsApp Business API and Baileys (a WhatsApp Web client) to send messages on behalf of institutes. <strong>All WhatsApp messaging functionality runs exclusively on our backend servers — no WhatsApp code runs on your device.</strong></p>
          <p style={{ marginTop: 8 }}>Institute staff must obtain consent from students/parents before enabling WhatsApp notifications. Consent is recorded per contact using the WhatsApp opt-in checkboxes in the admission form. Students or parents may opt out at any time by contacting the institute or sending STOP to the WhatsApp number.</p>
        </Section>

        <Section title="5. Data Storage & Security">
          <ul style={{ paddingLeft: 20 }}>
            <li>Data is stored on secure cloud servers (MongoDB Atlas / Render cloud).</li>
            <li>All data in transit is encrypted using HTTPS/TLS.</li>
            <li>Local device storage uses AES-256 encryption for cached sensitive fields (phone, Aadhaar).</li>
            <li>Access is restricted by institute-level isolation — each institute can only access its own data.</li>
            <li>Images and files are stored securely on Cloudinary.</li>
          </ul>
        </Section>

        <Section title="6. Aadhaar Number">
          <p>Aadhaar number collection is <strong>optional</strong> and is used solely for student identification within the institute's records. It is not shared with any government authority or third party. Institutes are responsible for compliance with applicable Indian regulations (UIDAI guidelines) when collecting Aadhaar data.</p>
        </Section>

        <Section title="7. Third-Party Services">
          <p>We use the following third-party services, each with their own privacy policies:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Cloudinary</strong> — image and file storage.</li>
            <li><strong>MongoDB Atlas</strong> — cloud database.</li>
            <li><strong>Render</strong> — cloud hosting.</li>
            <li><strong>WhatsApp Business API / Meta</strong> — messaging.</li>
          </ul>
        </Section>

        <Section title="8. Data Retention">
          <p>We retain your data for as long as your institute account is active. You may request deletion of your data at any time. Upon account closure, data is deleted within 30 days unless retention is required by law.</p>
        </Section>

        <Section title="9. Your Rights">
          <p>You have the right to:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Access the personal data we hold about your institute and students.</li>
            <li>Correct inaccurate data.</li>
            <li>Request deletion of your data.</li>
            <li>Opt out of WhatsApp notifications at any time.</li>
            <li>Export your data in CSV or PDF format from within the app.</li>
          </ul>
          <p style={{ marginTop: 8 }}>To exercise these rights, contact us at the address below.</p>
        </Section>

        <Section title="10. Children's Data">
          <p>Instify is a B2B platform used by educational institutes. Student data may include minors. Institute administrators are responsible for obtaining appropriate parental consent where required by applicable law before entering student data into the system.</p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. We will notify users of significant changes via the app or email. Continued use of the app after changes constitutes acceptance of the updated policy.</p>
        </Section>

        <Section title="12. Contact Us">
          <p>
            For privacy questions, data requests, or concerns:<br />
            <strong>Email:</strong> support@instify.in<br />
            <strong>Website:</strong> https://instify-kfpm.onrender.com<br />
            <strong>Address:</strong> Instify, India
          </p>
        </Section>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 24, textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
          © 2025 Instify. All rights reserved.
        </div>
      </div>
    </div>
  );
}
