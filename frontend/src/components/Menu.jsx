import React from 'react';

export default function Menu({
  menuItems,
  cart,
  onUpdateQty,
  activeCategory,
  setActiveCategory,
  searchTerm,
  setSearchTerm
}) {
  const categories = ['All', 'Breakfast', 'Lunch', 'Add-ons', 'Dinner', 'Egg Specials', 'Non Veg Specials', 'Beverages', 'Combos'];

  const getCartQty = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.qty : 0;
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'veg':
        return <span className="badge badge-veg">Veg</span>;
      case 'non-veg':
        return <span className="badge badge-nonveg">Non-Veg</span>;
      case 'egg':
        return <span className="badge badge-egg">Egg</span>;
      default:
        return null;
    }
  };

  const getTypeDot = (type) => {
    return <span className={`dot-indicator dot-${type}`} title={type}></span>;
  };

  return (
    <section id="menu" className="menu-section">
      <div className="container">
        <h2 className="section-title">Explore Our Menu</h2>
        <p className="section-subtitle">Freshly prepared, pure ingredients, and zero preservatives</p>

        {/* Filters and Search */}
        <div className="filter-bar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search dishes (e.g. Dosa, Biryani, Coffee...)"
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        {menuItems.length > 0 ? (
          <div className="menu-grid">
            {menuItems.map((item) => {
              const qty = getCartQty(item.id);
              const isAvailable = item.isAvailable !== false; // defaults to true if undefined

              return (
                <div key={item.id} className="dish-card" style={{ opacity: isAvailable ? 1 : 0.6 }}>
                  <div>
                    <div className="dish-header">
                      <div className="dish-indicator-wrap">
                        {getTypeDot(item.type)}
                        <h3 className="dish-name">{item.name}</h3>
                      </div>
                      <span className="dish-price">₹{item.price}</span>
                    </div>
                    <div className="dish-category">
                      {item.category} • {getTypeBadge(item.type)}
                    </div>
                  </div>

                  <div className="dish-action">
                    {!isAvailable ? (
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Unavailable today</span>
                    ) : qty === 0 ? (
                      <button
                        className="add-cart-btn"
                        onClick={() => onUpdateQty(item, 1)}
                      >
                        Add to Cart 🛒
                      </button>
                    ) : (
                      <div className="qty-control">
                        <button className="qty-btn" onClick={() => onUpdateQty(item, qty - 1)}>−</button>
                        <span className="qty-val">{qty}</span>
                        <button className="qty-btn" onClick={() => onUpdateQty(item, qty + 1)}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center" style={{ padding: '40px 0', color: 'var(--text-muted)' }}>
            <h3>No items found</h3>
            <p>Try searching for something else or changing the category filter.</p>
          </div>
        )}
      </div>
    </section>
  );
}
