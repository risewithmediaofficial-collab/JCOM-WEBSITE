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
        <section className="glass-card" style={{ padding: '32px clamp(20px, 4vw, 44px)', marginBottom: 24, boxShadow: 'none', background: '#ffffff' }}>
          <div className="badge badge-gold" style={{ marginBottom: 14 }}>About JCOM</div>
          <h1 style={{ marginBottom: 12 }}>
            Built to create <span className="highlight-gold">opportunities, leadership, and growth</span>
          </h1>
          <p style={{ maxWidth: 820, fontSize: '1rem' }}>
            JCOM stands for Junior Chamber Opportunities for Members. It is an initiative of JCI (Junior Chamber International) created to deliver exclusive benefits, meaningful opportunities, and practical value to every JCI member.
          </p>
        </section>

        <section className="responsive-two-col" style={{ marginBottom: 24, gap: 24 }}>
          <div className="glass-card" style={{ boxShadow: 'none', background: '#ffffff' }}>
            <h3 style={{ marginBottom: 14 }}>What Is JCOM?</h3>
            <p style={{ marginBottom: 14 }}>
              JCOM is also known as the Jaycees Chamber of Commerce. It is designed to give JCI members access to exclusive benefits, discounts, and opportunities that support both personal and professional progress.
            </p>
            <p style={{ marginBottom: 14 }}>
              Through JCOM, members can connect with partner brands and organizations in areas such as education and skill development, travel and hospitality, health and wellness, lifestyle and professional services, and business tools and resources.
            </p>
            <p>
              The main objective of JCOM is to add real value to JCI membership by supporting members&apos; personal, professional, and entrepreneurial growth in a practical way.
            </p>
          </div>

          <div className="glass-card-teal" style={{ boxShadow: 'none', background: '#ffffff' }}>
            <h3 style={{ marginBottom: 14 }}>Why It Matters</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Adds measurable value to every JCI membership',
                'Supports personal, professional, and entrepreneurial development',
                'Creates leadership opportunities through active participation',
                'Builds stronger communities through proactive members'
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
            <h2>Designed for lasting member development</h2>
          </div>

          <div className="grid-4">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="glass-card" style={{ height: '100%', boxShadow: 'none', background: '#ffffff' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(0,73,194,0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', marginBottom: 14 }}>
                  {pillar.icon}
                </div>
                <h4 style={{ marginBottom: 8 }}>{pillar.title}</h4>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{pillar.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card" style={{ marginTop: 24, boxShadow: 'none', background: '#ffffff' }}>
          <h3 style={{ marginBottom: 14 }}>Leadership Through Opportunity</h3>
          <p style={{ marginBottom: 14 }}>
            Jcom provides opportunities that empower its members to develop into leaders who are proactive in the communities around them. Through actively working in the areas of individual development, organisational management, community development, business growth, and domestic and international networking, Jcom members hone their own skills and become ever better versions of themselves.
          </p>
          <p style={{ margin: 0 }}>
            Jcom members constantly set standards of model citizenship and lead their peers by example. This is what makes JCOM more than a benefits initiative. It becomes a platform for leadership, growth, service, and influence across different forums and platforms.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
