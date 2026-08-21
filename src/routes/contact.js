const express = require("express");
const { Resend } = require("resend");

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  try {
    await resend.emails.send({
      from: "Anato Lab Contact Form <onboarding@resend.dev>",
      to: [process.env.CONTACT_EMAIL_USER],
      replyTo: email,
      subject: `New contact message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    res.status(500).json({ error: "Failed to send message. Please try again later." });
  }
});

module.exports = router;
