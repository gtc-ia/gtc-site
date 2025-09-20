import React from 'react';

export default function HeroOverlay() {
  const wrap: React.CSSProperties = {
    position: 'relative',
    zIndex: 10,
    maxWidth: 960,
    margin: '0 auto',
    padding: '64px 24px',
    textAlign: 'center',
    color: '#fff',
  };
  const h1: React.CSSProperties = { fontSize: '40px', lineHeight: 1.1, fontWeight: 600, margin: 0 };
  const sub: React.CSSProperties = { marginTop: 16, fontSize: 18, color: 'rgba(255,255,255,0.8)' };
  const row: React.CSSProperties = { marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' };
  const btn = (bg: string, color = '#0b1220'): React.CSSProperties => ({
    display: 'inline-block',
    padding: '12px 18px',
    borderRadius: 12,
    background: bg,
    color,
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'filter 0.2s ease',
  });

  return (
    <div style={wrap} aria-live="polite">
      <h1 style={h1}>AI-платформа для осознанных покупок</h1>
      <p style={sub}>Взвешанные решения: AI-консультант, новости, интеграция оплаты.</p>

      <div style={row}>
        <a
          href="https://t.me/Procurement_AnalystBot"
          target="_blank"
          rel="noopener noreferrer"
          style={btn('#67e8f9')}
        >
          Открыть бота
        </a>
        <a
          href="https://app.gtstor.com/news/"
          target="_blank"
          rel="noopener noreferrer"
          style={btn('rgba(255,255,255,0.12)', '#fff')}
        >
          Читать новости
        </a>
        <a
          href="https://pay.gtstor.com/payment.php"
          target="_blank"
          rel="noopener noreferrer"
          style={btn('#34d399')}
        >
          Оформить доступ
        </a>
      </div>
    </div>
  );
}
