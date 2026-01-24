import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import './Home.css';

function Home() {
    return (
        <div className="home">
            <Header />
            <Hero />
            <main className="home-content">
                <section className="features">
                    <div className="feature-card">
                        <h3>Fast</h3>
                        <p>Lightning quick performance.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Simple</h3>
                        <p>Clean and easy to use.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Reliable</h3>
                        <p>Built to last.</p>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Home;
