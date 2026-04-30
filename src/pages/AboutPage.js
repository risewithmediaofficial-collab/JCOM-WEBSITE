import React from 'react';
import { CalendarOutlined, EnvironmentOutlined, RiseOutlined, TeamOutlined } from '@ant-design/icons';
import Navbar from '../components/Navbar';

const pillars = [
  {
    icon: <TeamOutlined />,
    title: 'Trusted Networking',
    description: 'JCOM brings verified business owners, founders, and professionals into one structured network built around collaboration rather than competition.'
  },
  {
    icon: <RiseOutlined />,
    title: 'Business Growth',
    description: 'Members use connections, CRM tracking, meetings, and referrals to turn conversations into measurable revenue and long-term partnerships.'
  },
  {
    icon: <CalendarOutlined />,
    title: 'Structured Meetings',
    description: 'Weekly meeting themes keep every chapter active with growth sharing, problem solving, solutions, and business-to-business connecting.'
  },
  {
    icon: <EnvironmentOutlined />,
    title: 'Local Chapters',
    description: 'Each location runs as its own active chapter with tables, leadership roles, and members from varied business categories.'
  }
];

const AboutPage = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />

      <div className="page-shell">
        <section className="glass-card" style={{ padding: '32px clamp(20px, 4vw, 44px)', marginBottom: 24 }}>
          <div className="badge badge-gold" style={{ marginBottom: 14 }}>About JCOM</div>
          <h1 style={{ marginBottom: 12 }}>
            Built to help businesses <span className="highlight-gold">connect, collaborate, and grow</span>
          </h1>
          <p style={{ maxWidth: 820, fontSize: '1rem' }}>
            JCOM is a structured business networking platform where local chapters, table systems, CRM workflows, and live dashboards help members create genuine business opportunities. The goal is simple: make introductions that turn into action, follow-ups, and revenue.
          </p>
        </section>

        <section className="responsive-two-col" style={{ marginBottom: 24, gap: 24 }}>
          <div className="glass-card">
            <h3 style={{ marginBottom: 14 }}>How JCOM Works</h3>
            <p style={{ marginBottom: 14 }}>
              Members register under a location, get reviewed by chapter leadership, and then join the network with a membership ID. From there, connections, meetings, and CRM entries help track every opportunity from first contact to completed business.
            </p>
            <p>
              The structure is designed so leadership can manage locations, members can discover the right partners quickly, and the whole network can see real performance through live dashboards and leaderboard insights.
            </p>
          </div>

          <div className="glass-card-teal">
            <h3 style={{ marginBottom: 14 }}>What Makes It Different</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Verified business profiles and searchable member listings',
                'Chairman and admin approval workflow for quality control',
                'CRM and connection tracking tied to actual member activity',
                'Meeting attendance, revenue visibility, and chapter-level performance'
              ].map((item) => (
                <div key={item} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="badge badge-teal" style={{ marginBottom: 12 }}>Core Pillars</div>
            <h2>Designed for real-world business momentum</h2>
          </div>

          <div className="grid-4">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="glass-card" style={{ height: '100%' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(0,73,194,0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', marginBottom: 14 }}>
                  {pillar.icon}
                </div>
                <h4 style={{ marginBottom: 8 }}>{pillar.title}</h4>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{pillar.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
