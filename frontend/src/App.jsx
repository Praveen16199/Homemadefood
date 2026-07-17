import React, { useState, useEffect } from "react";
import Menu from "./components/Menu";
import Cart from "./components/Cart";
import Admin from "./components/Admin";
import { INITIAL_MENU } from "./initialMenu";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function App() {
  const [view, setView] = useState("store"); // 'store' or 'admin'
  const [menuItems, setMenuItems] = useState(INITIAL_MENU);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch menu data on mount
  const fetchMenu = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu`);
      if (!response.ok) throw new Error("Unable to fetch menu");
      const data = await response.json();
      setMenuItems(Array.isArray(data) && data.length > 0 ? data : INITIAL_MENU);
    } catch (err) {
      console.error("Error fetching menu items, falling back to local menu:", err);
      setMenuItems(INITIAL_MENU);
    }
  };

  useEffect(() => {
    fetchMenu();

    // Check hash for routing (e.g. #admin to open admin panel directly)
    const handleHashChange = () => {
      if (window.location.hash === "#admin") {
        setView("admin");
      } else {
        setView("store");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Run once on load

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Update Item Quantity in Cart
  const handleUpdateQty = (item, qty) => {
    if (qty < 0) return;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((cItem) => cItem.id === item.id);

      if (existingIndex !== -1) {
        if (qty === 0) {
          return prevCart.filter((cItem) => cItem.id !== item.id);
        }

        const updatedCart = [...prevCart];
        updatedCart[existingIndex] = { ...updatedCart[existingIndex], qty };
        return updatedCart;
      }

      if (qty > 0) {
        return [...prevCart, { ...item, qty }];
      }

      return prevCart;
    });
  };

  // Add Combo Special directly to Cart
  const handleAddCombo = () => {
    const comboItem = menuItems.find((item) => item.id === "c1");
    if (comboItem) {
      handleUpdateQty(comboItem, 1);
      setCartOpen(true);
    }
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Filter menu items based on category and search text
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  if (view === "admin") {
    return (
      <Admin
        onBackToMenu={() => {
          window.location.hash = "";
          setView("store");
        }}
        onMenuUpdated={fetchMenu}
      />
    );
  }

  return (
    <div>
      {/* Top Bar with Click-to-Call Hotline */}
      <div
        style={{
          backgroundColor: "var(--primary)",
          color: "#fff",
          fontSize: "0.85rem",
          padding: "8px 0",
          borderBottom: "2px solid var(--accent)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            📞 Call to Order:{" "}
            <a
              href="tel:+919360198417"
              style={{
                color: "var(--accent)",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              +91 9360198417
            </a>
          </div>
          <div>📍 Pozhichalur Main Road, Pammal, Chennai</div>
          <div>🕒 Fresh Daily: 7:30 AM - 10:00 PM</div>
        </div>
      </div>

      {/* Navigation Header */}
      <nav className="navbar">
        <div className="container nav-container">
          <div className="logo-section" onClick={() => window.scrollTo(0, 0)}>
            {/* Custom SVG logo representing Multi-Faith Harmony symbols (Om, Cross, Moon & Star) */}
            <div className="logo-icon">
              <svg
                viewBox="0 0 100 100"
                style={{ width: "40px", height: "40px" }}
              >
                {/* Circle border */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#FAF3E6"
                  strokeWidth="2"
                />

                {/* Top symbols semicircle: OM, CROSS, CRESCENT */}
                {/* Om (Left-ish) */}
                <text
                  x="22"
                  y="38"
                  fontSize="16"
                  fill="#C2913F"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  🕉
                </text>
                {/* Cross (Center-top) */}
                <text
                  x="50"
                  y="30"
                  fontSize="18"
                  fill="#C2913F"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  ✝
                </text>
                {/* Star & Crescent (Right-ish) */}
                <text
                  x="78"
                  y="38"
                  fontSize="16"
                  fill="#C2913F"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  ☪
                </text>

                {/* Hand and plate (Center-bottom) */}
                <path
                  d="M25,65 Q50,75 75,65 Q80,75 70,82 Q50,85 30,82 Q20,75 25,65 Z"
                  fill="#C2913F"
                  opacity="0.8"
                />
                <circle cx="50" cy="52" r="14" fill="#EADBCC" />
                <path d="M34,55 L66,55 A 1,1 0 0 1 50,55 Z" fill="#801A1A" />
                <rect
                  x="47"
                  y="37"
                  width="6"
                  height="4"
                  rx="2"
                  fill="#801A1A"
                />
              </svg>
            </div>
            <div className="logo-text">
              <h1>SS</h1>
              <span>Homemade Food</span>
            </div>
          </div>

          <div className="nav-actions">
            <a href="#menu" className="nav-link">
              Our Menu
            </a>
            <a href="#about" className="nav-link">
              About
            </a>
            <a href="#contact" className="nav-link">
              Contact
            </a>

            <button className="cart-btn" onClick={() => setCartOpen(true)}>
              Basket
              <span className="cart-count">{cartTotalItems}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <header className="hero">
        <div className="container">
          <h2>SS HOMEMADE FOOD</h2>
          <p className="hero-subtitle">Taste like home, served with love</p>
          <div className="hero-taglines">
            <span className="hero-tagline">🌿 Fresh</span>
            <span className="hero-tagline">❤️ Healthy</span>
            <span className="hero-tagline">🍳 Homemade</span>
          </div>
          <button
            className="hero-cta"
            onClick={() => document.getElementById("menu").scrollIntoView()}
          >
            Order Fresh Food Now
          </button>
        </div>
      </header>

      {/* Highlights Grid */}
      <section className="highlights container">
        <div className="highlights-grid">
          <div className="highlight-card">
            <div className="highlight-icon">🥘</div>
            <h3>100% Homemade</h3>
            <p>
              Every dish is cooked in a clean home kitchen environment with
              maximum care and taste just like mothers make.
            </p>
          </div>
          <div className="highlight-card">
            <div className="highlight-icon">🍅</div>
            <h3>Pure Ingredients</h3>
            <p>
              We use premium quality oils, fresh vegetables daily, hand-ground
              spices, and absolutely zero artificial food colorings.
            </p>
          </div>
          <div className="highlight-card">
            <div className="highlight-icon">🛡️</div>
            <h3>No Preservatives</h3>
            <p>
              We do not store cooked food or add MSG/tasting salt. Made
              completely fresh everyday to order.
            </p>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section
        id="about"
        style={{
          padding: "80px 0",
          backgroundColor: "var(--bg-secondary)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="container">
          <h2 className="section-title">About SS Homemade Food</h2>
          <p className="section-subtitle">
            Pure, healthy home-style meals for everyone
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "40px",
              marginTop: "40px",
              alignItems: "center",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "1.8rem",
                  color: "var(--primary)",
                  marginBottom: "15px",
                }}
              >
                Taste Like Home, Served With Love
              </h3>
              <p style={{ color: "var(--text-muted)", marginBottom: "15px" }}>
                At SS Homemade Food, we prepare every meal with the utmost care,
                utilizing hand-picked spices and premium fresh ingredients. We
                cater to families, students, and busy professionals who miss the
                authentic warmth of home-cooked meals.
              </p>
              <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>
                Our kitchen operates on multi-faith principles of clean eating,
                harmony, and love for everyone. We do not store leftovers, and
                we do not use food colors or MSG.
              </p>

              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <div
                  style={{
                    background: "var(--bg-primary)",
                    padding: "12px 20px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontWeight: "bold", color: "var(--primary)" }}>
                    ✓
                  </span>{" "}
                  Clean Environment
                </div>
                <div
                  style={{
                    background: "var(--bg-primary)",
                    padding: "12px 20px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontWeight: "bold", color: "var(--primary)" }}>
                    ✓
                  </span>{" "}
                  Handground Masala
                </div>
              </div>
            </div>

            <div
              style={{
                position: "relative",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                boxShadow: "var(--shadow-md)",
                height: "350px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundImage: 'url("/hero_food.png")',
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  bottom: "0",
                  left: "0",
                  right: "0",
                  background:
                    "linear-gradient(transparent, rgba(128, 26, 26, 0.95))",
                  padding: "30px 20px",
                  color: "#fff",
                }}
              >
                <p style={{ fontStyle: "italic", fontWeight: 600 }}>
                  "Pure ingredients, delicious traditional recipes, and zero
                  artificial preservatives. Good Food, Good Mood!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Combo Special Offer */}
      <section className="combo-section container">
        <div className="combo-card">
          <div className="combo-image"></div>
          <div className="combo-content">
            <div className="combo-badge">₹159 ONLY</div>
            <h3>Special Chettinad Combo</h3>
            <p>
              Get a complete wholesome non-veg meal consisting of two soft
              chapatis, spicy flavorful Chettinad Chicken gravy, a whole boiled
              egg, and a refreshing chilled Pepsi.
            </p>
            <div className="combo-items-list">
              <span className="combo-item-pill">🫓 2 Chapati</span>
              <span className="combo-item-pill">🍗 Chettinad Chicken</span>
              <span className="combo-item-pill">🥚 Boiled Egg</span>
              <span className="combo-item-pill">🥤 Pepsi</span>
            </div>
            <button className="combo-btn" onClick={handleAddCombo}>
              Add Combo to Basket 🛒
            </button>
          </div>
        </div>
      </section>

      {/* Menu browser component */}
      <Menu
        menuItems={filteredMenuItems}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Contact & Info section (Renamed ID from about to contact) */}
      <section
        id="contact"
        className="info-section"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="container">
          <h2 className="section-title">Contact & Location</h2>
          <p className="section-subtitle">
            Drop by or order online. We are located right in Pammal, Chennai
          </p>

          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon">📍</div>
              <h3>Our Address</h3>
              <p>
                32, Pozhichalur Main Road,
                <br />
                Pammal, Chennai, Tamil Nadu 600075
              </p>
              <a
                href="https://maps.google.com/?q=32,+Pozhichalur+Main+Road,+Pammal,+Chennai+600075"
                target="_blank"
                rel="noreferrer"
                className="map-btn"
              >
                View on Google Maps
              </a>
            </div>

            <div className="info-card">
              <div className="info-icon">📞</div>
              <h3>Order Hotline</h3>
              <p>
                Touch the number below to call and place your custom orders
                directly:
              </p>
              <p
                style={{
                  fontSize: "1.4rem",
                  fontWeight: "bold",
                  marginTop: "10px",
                }}
              >
                <a
                  href="tel:+919360198417"
                  style={{
                    color: "var(--primary)",
                    textDecoration: "underline",
                  }}
                >
                  +91 9360198417
                </a>
              </p>
            </div>

            <div className="info-card">
              <div className="info-icon">🕒</div>
              <h3>Timings</h3>
              <p>
                <strong>Breakfast:</strong> 7:30 AM - 10:30 AM
              </p>
              <p>
                <strong>Lunch:</strong> 12:30 PM - 3:30 PM
              </p>
              <p>
                <strong>Dinner:</strong> 7:00 PM - 10:00 PM
              </p>
              <p
                style={{
                  color: "var(--accent)",
                  fontWeight: 600,
                  marginTop: "8px",
                }}
              >
                Open Everyday
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cart Drawer panel */}
      <Cart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onClearCart={handleClearCart}
      />

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <h3>SS Homemade Food</h3>
              <p>
                Bringing you the authentic taste of home cooking using
                high-quality ingredients, clean methods, and a pinch of love.
              </p>
            </div>
            <div className="footer-col">
              <h3>Quick Order Info</h3>
              <p>
                Browse our menu, select your dishes, and check out directly to
                WhatsApp. We'll reply with confirmation and delivery time right
                away.
              </p>
            </div>
            <div className="footer-col">
              <h3>Get In Touch</h3>
              <p>📍 32, Pozhichalur Main Road, Pammal, Chennai 600075</p>
              <p style={{ marginTop: "10px" }}>
                📞 Call:{" "}
                <a
                  href="tel:+919360198417"
                  style={{
                    color: "var(--accent)",
                    fontWeight: "bold",
                    textDecoration: "none",
                  }}
                >
                  +91 9360198417
                </a>
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>
              &copy; {new Date().getFullYear()} SS Homemade Food. All rights
              reserved.
            </p>
            <p style={{ marginTop: "10px" }}>
              Are you the owner?{" "}
              <a
                href="#admin"
                style={{ color: "var(--accent)", fontWeight: "bold" }}
              >
                Access Admin Dashboard
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
