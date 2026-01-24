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
                {/* Add your content here */}
            </main>
        </div>
    );
}

export default Home;
