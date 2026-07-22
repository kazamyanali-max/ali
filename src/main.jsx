import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './styles.css';
import { business, portfolio, services } from './data/siteData';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [['#home', 'Home'], ['#services', 'Services'], ['#portfolio', 'Portfolio'], ['#about', 'About'], ['#contact', 'Contact']];
  return (
    <header className="navbar">
      <Link className="logo" to="#home" onClick={() => setOpen(false)}><span>CT</span>{business.brand}</Link>
      <nav className={open ? 'nav-links is-open' : 'nav-links'}>
        {links.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
      </nav>
      <a className="nav-call" href={`tel:${business.phoneHref}`}>تماس فوری</a>
      <button className="menu" type="button" onClick={() => setOpen(!open)} aria-label="باز کردن منو"><span /><span /><span /></button>
    </header>
  );
}

function Computer3D() {
  return <motion.div className="computer-scene" animate={{ y: [0, -18, 0], rotateY: [-10, 8, -10] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
    <div className="halo" />
    <div className="monitor"><div className="monitor-bar"><i /><i /><i /><b>Cafenet Time</b></div><div className="monitor-grid"><span /><span /><span /><span /></div></div>
    <div className="stand" /><div className="base" />
    <span className="chip chip-a">React</span><span className="chip chip-b">IT</span><span className="chip chip-c">Web</span>
  </motion.div>;
}

function Hero() {
  return <section id="home" className="hero section">
    <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: .7 }} className="hero-copy">
      <p className="eyebrow">Premium Computer & IT Services</p>
      <h1>کافی نت تایم</h1>
      <p className="subtitle">مرکز خدمات کامپیوتری، طراحی سایت و راهکارهای دیجیتال</p>
      <p className="hero-text">یک تجربه مدرن و حرفه‌ای برای خدمات کامپیوتر، طراحی وب، اینترنت و تعمیرات؛ با مدیریت {business.owner}.</p>
      <div className="actions"><a className="btn primary" href="#contact">شروع پروژه</a><a className="btn ghost" href={`tel:${business.phoneHref}`}>تماس فوری</a></div>
    </motion.div>
    <Computer3D />
  </section>;
}

function Services() {
  return <section id="services" className="section"><div className="section-head"><p className="eyebrow">Services</p><h2>خدمات تخصصی با استاندارد یک شرکت تکنولوژی</h2></div><div className="grid services-grid">{services.map(([title, description], index) => <motion.article className="glass-card service" key={title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: index * .04 }} whileHover={{ y: -10, scale: 1.02 }}><div className="service-icon">{String(index + 1).padStart(2, '0')}</div><h3>{title}</h3><p>{description}</p></motion.article>)}</div></section>;
}

function Portfolio() {
  return <section id="portfolio" className="section"><div className="section-head"><p className="eyebrow">Portfolio</p><h2>نمونه پروژه‌های آماده برای توسعه</h2></div><div className="grid portfolio-grid">{portfolio.map(([title, text]) => <motion.article className="project-card" key={title} whileHover={{ y: -8 }}><div className="project-visual" /><span>{title}</span><h3>{text}</h3></motion.article>)}</div></section>;
}

function About() {
  return <section id="about" className="section about"><motion.div className="glass-card about-card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}><p className="eyebrow">About</p><h2>درباره کافی نت تایم</h2><p>کافی نت تایم با مدیریت علی کاظمیان ارائه دهنده خدمات تخصصی کامپیوتر، طراحی سایت و خدمات اینترنتی با هدف ارائه خدمات سریع، حرفه‌ای و با کیفیت.</p><div className="stats"><b>+100<span>پروژه انجام شده</span></b><b>+5<span>سال تجربه</span></b><b>24/7<span>پشتیبانی سریع</span></b></div></motion.div></section>;
}

function Contact() {
  const [status, setStatus] = useState('');
  const submitOrder = async (event) => {
    event.preventDefault();
    setStatus('در حال ثبت سفارش...');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'ثبت سفارش ناموفق بود.');
      setStatus(result.message);
      event.currentTarget.reset();
    } catch (error) { setStatus(error.message); }
  };
  return <section id="contact" className="section contact"><div className="contact-info"><p className="eyebrow">Contact</p><h2>شروع پروژه یا ثبت سفارش</h2><p><b>نام:</b> {business.owner}</p><p><b>تلفن:</b> {business.phone}</p><p><b>آدرس:</b> {business.address}</p><div className="actions"><a className="btn primary" href={`tel:${business.phoneHref}`}>Call</a><a className="btn whatsapp" href={`https://wa.me/${business.phoneHref.replace('+', '')}`}>WhatsApp</a><a className="btn ghost" href={business.mapUrl}>Google Map</a></div></div><form className="order-form glass-card" onSubmit={submitOrder}><input name="name" placeholder="نام شما" required minLength="2" /><input name="phone" placeholder="شماره تماس" required /><select name="service" required><option value="">نوع خدمت</option>{services.map(([title]) => <option key={title} value={title}>{title}</option>)}</select><textarea name="message" placeholder="توضیحات سفارش" required minLength="10" /><button className="btn primary" type="submit">ثبت سفارش</button><small>{status}</small></form></section>;
}

function App() { return <BrowserRouter><Navbar /><main><Hero /><Services /><Portfolio /><About /><Contact /></main><footer><b>{business.brand}</b><span>{business.phone} · {business.address}</span></footer></BrowserRouter>; }

createRoot(document.getElementById('root')).render(<App />);
