import React from 'react';
import './Header.css';

function Header() {
    return (
        <header className="header">
            <div className="header-container">
                <div className="logo">
                    <h1>Clank & Found</h1>
                </div>
                <nav className="nav">
                    <ul>
                        <li><a href="/">Home</a></li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}

export default Header;
