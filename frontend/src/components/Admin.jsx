import React, { useState, useEffect } from "react";
import { apiFetch } from "../api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function Admin({ onBackToMenu, onMenuUpdated }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState("orders"); // 'orders' or 'menu'
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderFilter, setOrderFilter] = useState("All");
  const [menuSearch, setMenuSearch] = useState("");

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addId, setAddId] = useState("");
  const [addName, setAddName] = useState("");
  const [addCategory, setAddCategory] = useState("Breakfast");
  const [addPrice, setAddPrice] = useState("");
  const [addType, setAddType] = useState("veg");
  const [addIsAvailable, setAddIsAvailable] = useState(true);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("Breakfast");
  const [editPrice, setEditPrice] = useState("");
  const [editType, setEditType] = useState("veg");
  const [editIsAvailable, setEditIsAvailable] = useState(true);

  // Check login on load
  useEffect(() => {
    const token = localStorage.getItem("ss_admin_token");
    if (token) {
      setIsLoggedIn(true);
      fetchOrders();
      fetchMenuItems();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const data = await apiFetch("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (data.success) {
        localStorage.setItem("ss_admin_token", data.token);
        setIsLoggedIn(true);
        fetchOrders();
        fetchMenuItems();
      } else {
        setLoginError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setLoginError("Error connecting to backend");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ss_admin_token");
    setIsLoggedIn(false);
    setSelectedOrder(null);
  };

  const fetchOrders = async () => {
    try {
      const data = await apiFetch("/api/orders");
      setOrders(data);
      if (data.length > 0 && !selectedOrder) {
        setSelectedOrder(data[0]);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const data = await apiFetch("/api/menu");
      setMenuItems(data);
    } catch (err) {
      console.error("Error fetching menu items:", err);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const data = await apiFetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      if (data.success) {
        // Update local state
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order,
          ),
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const handlePriceSave = async (itemId, newPrice) => {
    const parsedPrice = parseFloat(newPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      alert("Please enter a valid price.");
      return;
    }
    try {
      const data = await apiFetch(`/api/menu/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ price: parsedPrice }),
      });
      if (data.success) {
        setMenuItems(
          menuItems.map((item) =>
            item.id === itemId ? { ...item, price: parsedPrice } : item,
          ),
        );
        alert("Price updated successfully!");
        if (onMenuUpdated) onMenuUpdated();
      }
    } catch (err) {
      console.error("Error updating item price:", err);
    }
  };

  const handleAvailabilityToggle = async (itemId, currentAvailability) => {
    const newAvailability = !currentAvailability;
    try {
      const data = await apiFetch(`/api/menu/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ isAvailable: newAvailability }),
      });
      if (data.success) {
        setMenuItems(
          menuItems.map((item) =>
            item.id === itemId
              ? { ...item, isAvailable: newAvailability }
              : item,
          ),
        );
        if (onMenuUpdated) onMenuUpdated();
      }
    } catch (err) {
      console.error("Error toggling availability:", err);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!addId || !addName || !addPrice) {
      alert("Please fill in all required fields.");
      return;
    }
    const parsedPrice = parseFloat(addPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      alert("Please enter a valid price.");
      return;
    }
    try {
      const data = await apiFetch("/api/menu", {
        method: "POST",
        body: JSON.stringify({
          id: addId,
          name: addName,
          category: addCategory,
          price: parsedPrice,
          type: addType,
          isAvailable: addIsAvailable
        })
      });
      if (data.success) {
        alert("Menu item added successfully!");
        setShowAddModal(false);
        setAddId("");
        setAddName("");
        setAddCategory("Breakfast");
        setAddPrice("");
        setAddType("veg");
        setAddIsAvailable(true);
        fetchMenuItems();
        if (onMenuUpdated) onMenuUpdated();
      } else {
        alert(data.message || "Failed to add menu item.");
      }
    } catch (err) {
      alert(err.message || "Error adding menu item.");
    }
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editName || !editPrice) {
      alert("Please fill in all required fields.");
      return;
    }
    const parsedPrice = parseFloat(editPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      alert("Please enter a valid price.");
      return;
    }
    try {
      const data = await apiFetch(`/api/menu/${editingItem.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editName,
          category: editCategory,
          price: parsedPrice,
          type: editType,
          isAvailable: editIsAvailable
        })
      });
      if (data.success) {
        alert("Menu item updated successfully!");
        setShowEditModal(false);
        setEditingItem(null);
        fetchMenuItems();
        if (onMenuUpdated) onMenuUpdated();
      } else {
        alert(data.message || "Failed to update menu item.");
      }
    } catch (err) {
      alert(err.message || "Error updating menu item.");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm(`Are you sure you want to permanently delete menu item "${itemId}"?`)) {
      return;
    }
    try {
      const data = await apiFetch(`/api/menu/${itemId}`, {
        method: "DELETE"
      });
      if (data.success) {
        alert("Menu item deleted successfully!");
        fetchMenuItems();
        if (onMenuUpdated) onMenuUpdated();
      } else {
        alert(data.message || "Failed to delete menu item.");
      }
    } catch (err) {
      alert(err.message || "Error deleting menu item.");
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditPrice(item.price);
    setEditType(item.type || "veg");
    setEditIsAvailable(item.isAvailable !== false);
    setShowEditModal(true);
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (orderFilter === "All") return true;
    return order.status.toLowerCase() === orderFilter.toLowerCase();
  });

  // Filter menu items for search
  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(menuSearch.toLowerCase()),
  );

  if (!isLoggedIn) {
    return (
      <div className="container">
        <div className="admin-login-card">
          <h2>SS Food Admin Panel</h2>
          <p>Login to manage orders and menu prices</p>

          {loginError && <div className="error-message">{loginError}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>
            <button type="submit" className="admin-login-btn">
              Log In
            </button>
          </form>

          <button
            onClick={onBackToMenu}
            style={{
              marginTop: "15px",
              background: "none",
              border: "none",
              color: "var(--accent-hover)",
              cursor: "pointer",
              fontWeight: 600,
              width: "100%",
              textAlign: "center",
            }}
          >
            ← Back to Storefront
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-view">
      <div className="container">
        {/* Admin Header */}
        <div className="admin-header">
          <div>
            <h1>SS Homemade Food</h1>
            <p style={{ color: "var(--accent-hover)", fontWeight: "bold" }}>
              Restaurant Control Center ⚙️
            </p>
          </div>
          <div style={{ display: "flex", gap: "15px" }}>
            <button className="admin-logout-btn" onClick={onBackToMenu}>
              Go to Store
            </button>
            <button
              className="admin-logout-btn"
              style={{ borderColor: "var(--nonveg)", color: "var(--nonveg)" }}
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("orders");
              fetchOrders();
            }}
          >
            Active Orders (
            {
              orders.filter(
                (o) => o.status !== "Delivered" && o.status !== "Cancelled",
              ).length
            }
            )
          </button>
          <button
            className={`admin-tab ${activeTab === "menu" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("menu");
              fetchMenuItems();
            }}
          >
            Menu Price Editor
          </button>
        </div>

        {/* Tab content: Orders */}
        {activeTab === "orders" && (
          <div>
            {/* Filter chips */}
            <div className="orders-filter-chips">
              {[
                "All",
                "Pending",
                "Preparing",
                "Out for Delivery",
                "Delivered",
                "Cancelled",
              ].map((filter) => (
                <button
                  key={filter}
                  className={`filter-chip ${orderFilter === filter ? "active" : ""}`}
                  onClick={() => setOrderFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="admin-dashboard-grid">
              {/* Orders List Panel */}
              <div className="orders-list-panel">
                <h3 style={{ marginBottom: "15px" }}>Order List</h3>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`order-row-item ${selectedOrder && selectedOrder.id === order.id ? "selected" : ""}`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="order-meta">
                        <h4>
                          Order #{order.id} - {order.customerName}
                        </h4>
                        <span className="order-date">
                          {new Date(order.date).toLocaleString()}
                        </span>
                      </div>
                      <div
                        className="order-price-status"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: "4px",
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>
                          ₹{order.totalAmount}
                        </span>
                        <span
                          className={`status-badge status-${order.status.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {order.status}
                        </span>
                        {order.paymentStatus === "Paid" && (
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: "#1b5e20",
                              color: "#ffffff",
                              fontSize: "0.7rem",
                              padding: "2px 6px",
                            }}
                          >
                            Paid
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p
                    style={{
                      color: "var(--text-muted)",
                      textAlign: "center",
                      padding: "40px 0",
                    }}
                  >
                    No orders found matching this filter.
                  </p>
                )}
              </div>

              {/* Order Detail Panel */}
              <div className="order-detail-panel">
                {selectedOrder ? (
                  <>
                    <div className="order-detail-header">
                      <h3>Order Detail - #{selectedOrder.id}</h3>
                      <span className="order-date">
                        {new Date(selectedOrder.date).toLocaleString()}
                      </span>
                    </div>

                    <div className="order-customer-info">
                      <p>
                        <strong>Customer Name:</strong>{" "}
                        {selectedOrder.customerName}
                      </p>
                      <p>
                        <strong>Phone:</strong>{" "}
                        <a href={`tel:${selectedOrder.customerPhone}`}>
                          {selectedOrder.customerPhone}
                        </a>
                      </p>
                      <p>
                        <strong>Address:</strong>{" "}
                        {selectedOrder.deliveryAddress}
                      </p>
                      {selectedOrder.paymentStatus && (
                        <p>
                          <strong>Payment Status:</strong>{" "}
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor:
                                selectedOrder.paymentStatus === "Paid"
                                  ? "#1b5e20"
                                  : "#b71c1c",
                              color: "#ffffff",
                              fontSize: "0.8rem",
                              padding: "3px 8px",
                            }}
                          >
                            {selectedOrder.paymentStatus}
                          </span>
                          {selectedOrder.paymentMethod &&
                            ` (${selectedOrder.paymentMethod})`}
                        </p>
                      )}
                      {selectedOrder.transactionId && (
                        <p>
                          <strong>Transaction ID:</strong>{" "}
                          <code
                            style={{
                              background: "var(--bg-secondary)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              border: "1px solid var(--border)",
                              fontSize: "0.85rem",
                            }}
                          >
                            {selectedOrder.transactionId}
                          </code>
                        </p>
                      )}
                    </div>

                    <div className="order-items-summary">
                      <h4 style={{ marginBottom: "10px" }}>Items Summary</h4>
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="order-item-summary-row">
                          <span>
                            {item.name} x {item.qty}
                          </span>
                          <span>₹{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: 800,
                        fontSize: "1.1rem",
                        marginBottom: "20px",
                      }}
                    >
                      <span>Grand Total:</span>
                      <span style={{ color: "var(--primary)" }}>
                        ₹{selectedOrder.totalAmount}
                      </span>
                    </div>

                    <div className="status-selector">
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          marginBottom: "6px",
                        }}
                      >
                        Update Order Status:
                      </label>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) =>
                          handleStatusChange(selectedOrder.id, e.target.value)
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Out for Delivery">
                          Out for Delivery
                        </option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div style={{ marginTop: "20px" }}>
                      <a
                        href={`https://wa.me/91${selectedOrder.customerPhone}?text=Hi%20${selectedOrder.customerName},%20we%20have%20received%20your%20order%20%23${selectedOrder.id}.%20It%20is%20now%20${selectedOrder.status.toLowerCase()}.`}
                        target="_blank"
                        rel="noreferrer"
                        className="order-btn"
                        style={{
                          padding: "8px 15px",
                          fontSize: "0.9rem",
                          width: "100%",
                          textDecoration: "none",
                        }}
                      >
                        Message Customer 💬
                      </a>
                    </div>
                  </>
                ) : (
                  <p
                    style={{ color: "var(--text-muted)", textAlign: "center" }}
                  >
                    Select an order from the list to view details.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab content: Menu Editor */}
        {activeTab === "menu" && (
          <div className="menu-editor-panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "15px",
                marginBottom: "20px"
              }}
            >
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <h3>Manage Menu Items</h3>
                <button
                  className="add-item-btn"
                  onClick={() => setShowAddModal(true)}
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "#fff",
                    border: "none",
                    padding: "8px 15px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "0.9rem"
                  }}
                >
                  + Add Menu Item
                </button>
              </div>
              <input
                type="text"
                placeholder="Search menu item..."
                className="search-input"
                style={{ maxWidth: "300px", margin: 0, padding: "10px 15px" }}
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
              />
            </div>

            <div className="menu-editor-grid">
              {filteredMenuItems.map((item) => {
                const isAvailable = item.isAvailable !== false;
                return (
                  <div
                    key={item.id}
                    className="menu-edit-card"
                    style={{ opacity: isAvailable ? 1 : 0.6 }}
                  >
                    <div className="menu-edit-info">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <h4>{item.name}</h4>
                        <span 
                          className={`dot-indicator dot-${item.type || 'veg'}`} 
                          title={item.type || 'veg'}
                          style={{ marginTop: "4px" }}
                        ></span>
                      </div>
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {item.category} • ID: {item.id}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      {/* Price Control */}
                      <div className="menu-edit-controls">
                        <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                          ₹
                        </span>
                        <input
                          type="number"
                          defaultValue={item.price}
                          className="price-edit-input"
                          id={`price-input-${item.id}`}
                        />
                        <button
                          className="save-price-btn"
                          onClick={() => {
                            const val = document.getElementById(
                              `price-input-${item.id}`,
                            ).value;
                            handlePriceSave(item.id, val);
                          }}
                        >
                          Save
                        </button>
                      </div>

                      {/* Availability toggle */}
                      <label className="available-toggle-label">
                        <input
                          type="checkbox"
                          checked={isAvailable}
                          onChange={() =>
                            handleAvailabilityToggle(item.id, isAvailable)
                          }
                        />
                        Available
                      </label>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "10px",
                        marginTop: "15px",
                        borderTop: "1px solid var(--border)",
                        paddingTop: "10px"
                      }}
                    >
                      <button
                        onClick={() => openEditModal(item)}
                        style={{
                          background: "none",
                          border: "1px solid var(--accent)",
                          color: "var(--accent-hover)",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          fontWeight: 600
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        style={{
                          background: "none",
                          border: "1px solid var(--nonveg)",
                          color: "var(--nonveg)",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          fontWeight: 600
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="cart-drawer-backdrop open" style={{ zIndex: 1100 }} onClick={() => setShowAddModal(false)}>
          <div className="cart-drawer" style={{ padding: "30px", maxWidth: "450px", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0 }}>Add New Menu Item</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddItem}>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: 600 }}>Item ID (e.g. b5, nv3, c2)</label>
                <input
                  type="text"
                  required
                  value={addId}
                  onChange={(e) => setAddId(e.target.value)}
                  placeholder="Enter unique item ID"
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text)" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: 600 }}>Item Name</label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Enter item name"
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text)" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: 600 }}>Category</label>
                <select
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text)" }}
                >
                  {['Breakfast', 'Lunch', 'Add-ons', 'Dinner', 'Egg Specials', 'Non Veg Specials', 'Beverages', 'Combos'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: 600 }}>Price (₹)</label>
                <input
                  type="number"
                  required
                  value={addPrice}
                  onChange={(e) => setAddPrice(e.target.value)}
                  placeholder="Enter price in INR"
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text)" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: 600 }}>Food Type</label>
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text)" }}
                >
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-Veg</option>
                  <option value="egg">Egg</option>
                </select>
              </div>
              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "15px", marginBottom: "20px" }}>
                <input
                  type="checkbox"
                  id="add-available"
                  checked={addIsAvailable}
                  onChange={(e) => setAddIsAvailable(e.target.checked)}
                  style={{ width: "auto", margin: 0 }}
                />
                <label htmlFor="add-available" style={{ margin: 0, cursor: "pointer", fontWeight: 600 }}>Item is Available</label>
              </div>
              <button type="submit" className="order-btn" style={{ width: "100%", border: "none", padding: "12px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>
                Save Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="cart-drawer-backdrop open" style={{ zIndex: 1100 }} onClick={() => { setShowEditModal(false); setEditingItem(null); }}>
          <div className="cart-drawer" style={{ padding: "30px", maxWidth: "450px", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0 }}>Edit Menu Item ({editingItem.id})</h3>
              <button 
                onClick={() => { setShowEditModal(false); setEditingItem(null); }}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditItem}>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: 600 }}>Item Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter item name"
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text)" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: 600 }}>Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text)" }}
                >
                  {['Breakfast', 'Lunch', 'Add-ons', 'Dinner', 'Egg Specials', 'Non Veg Specials', 'Beverages', 'Combos'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: 600 }}>Price (₹)</label>
                <input
                  type="number"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="Enter price in INR"
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text)" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "0.9rem", fontWeight: 600 }}>Food Type</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text)" }}
                >
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-Veg</option>
                  <option value="egg">Egg</option>
                </select>
              </div>
              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "15px", marginBottom: "20px" }}>
                <input
                  type="checkbox"
                  id="edit-available"
                  checked={editIsAvailable}
                  onChange={(e) => setEditIsAvailable(e.target.checked)}
                  style={{ width: "auto", margin: 0 }}
                />
                <label htmlFor="edit-available" style={{ margin: 0, cursor: "pointer", fontWeight: 600 }}>Item is Available</label>
              </div>
              <button type="submit" className="order-btn" style={{ width: "100%", border: "none", padding: "12px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>
                Update Item
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
