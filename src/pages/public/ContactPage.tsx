import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, CheckCircle2, Mail, MapPin, PhoneCall, Send } from 'lucide-react';
import { PublicPageShell, PageHero } from '@/components/home/PublicPageShell';

const contactChannels = [
  {
    icon: PhoneCall,
    title: 'Hotline',
    value: '1900 636 447',
    hint: '24/7 operations support',
    href: 'tel:1900636447',
  },
  {
    icon: Mail,
    title: 'Email',
    value: 'support@pbms.com',
    hint: 'Replies within 1 business day',
    href: 'mailto:support@pbms.com',
  },
  {
    icon: MapPin,
    title: 'Head Office',
    value: 'FPT University, Ho Chi Minh City',
    hint: 'Mon–Fri, 8:00–17:30',
    href: undefined,
  },
  {
    icon: Building2,
    title: 'Partnership',
    value: 'business@pbms.com',
    hint: 'Deploy PBMS at your building',
    href: 'mailto:business@pbms.com',
  },
];

const faqs = [
  {
    question: 'How do I register my building with PBMS?',
    answer:
      'Email business@pbms.com or call the hotline. Our team surveys the parking lot, configures floors/zones/slots, and trains your gate staff — deployment usually takes under a week.',
  },
  {
    question: 'What happens if the camera cannot read my plate?',
    answer:
      'Gate staff can always correct or enter the plate manually. Your parking session is never blocked by a failed scan.',
  },
  {
    question: 'Can I get a refund when cancelling a long-term package?',
    answer:
      'Yes. Each building publishes its refund policy — by default you receive 80% of the remaining value when cancelling early.',
  },
  {
    question: 'Is cash still accepted?',
    answer:
      'Yes. Staff can record cash payments, which managers confirm at the end of each shift, so reports always match the drawer.',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', topic: 'General question', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    // Chưa có endpoint contact ở BE — hiển thị xác nhận phía client.
    setSent(true);
  };

  return (
    <PublicPageShell>
      <PageHero
        eyebrow="Contact Us"
        title={
          <>
            Talk to the{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent">PBMS team</span>
          </>
        }
        description="Questions about parking, packages, or deploying PBMS at your building? Reach us through any channel below — or drop a message and we'll get back to you."
      />

      {/* Contact channels */}
      <section className="pb-14 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactChannels.map((channel, index) => {
              const Icon = channel.icon;
              const content = (
                <>
                  <div className="p-2.5 w-fit rounded-xl bg-cyan-500/10 border border-cyan-500/15 text-cyan-400">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">{channel.title}</h3>
                  <p className="mt-1 text-sm font-black text-white">{channel.value}</p>
                  <p className="mt-1 text-[11px] text-slate-400 font-semibold">{channel.hint}</p>
                </>
              );
              const className =
                'block rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md p-5 hover:border-cyan-500/20 hover:shadow-[0_0_25px_rgba(6,182,212,0.06)] transition-all duration-300';
              return (
                <motion.div
                  key={channel.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.07 }}
                >
                  {channel.href ? (
                    <a href={channel.href} className={className}>
                      {content}
                    </a>
                  ) : (
                    <div className={className}>{content}</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Form + FAQ */}
      <section className="py-14 relative z-10 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-10">
          {/* Message form */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Send a Message</span>
            <h2 className="text-2xl font-black mt-2 text-white">We usually reply within a day</h2>

            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center"
              >
                <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
                <h3 className="mt-3 text-sm font-black text-white">Message received!</h3>
                <p className="mt-2 text-xs text-slate-400 font-semibold">
                  Thanks {form.name} — we will reply to {form.email} as soon as possible.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                      Your Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Nguyen Van A"
                      required
                      className="mt-1.5 w-full px-4 py-3 bg-slate-900/60 border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/35 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      required
                      className="mt-1.5 w-full px-4 py-3 bg-slate-900/60 border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/35 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-topic" className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                    Topic
                  </label>
                  <select
                    id="contact-topic"
                    value={form.topic}
                    onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                    className="mt-1.5 w-full px-4 py-3 bg-slate-900/60 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500/35 transition-all"
                  >
                    <option>General question</option>
                    <option>Parking & packages</option>
                    <option>Payment & wallet</option>
                    <option>Deploy PBMS at my building</option>
                    <option>Report a problem</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="contact-message" className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us what you need..."
                    required
                    rows={5}
                    className="mt-1.5 w-full px-4 py-3 bg-slate-900/60 border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/35 transition-all resize-none"
                  />
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(6,182,212,0.35)' }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-300"
                >
                  Send Message <Send size={13} />
                </motion.button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">FAQ</span>
            <h2 className="text-2xl font-black mt-2 text-white">Frequently asked questions</h2>
            <div className="mt-6 space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.07 }}
                  className="rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md p-5"
                >
                  <h3 className="text-xs font-black text-white">{faq.question}</h3>
                  <p className="mt-2 text-[11px] text-slate-400 font-semibold leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
