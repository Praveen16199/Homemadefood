import React, { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function Cart({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onClearCart,
}) {
  const [step, setStep] = useState("cart"); // 'cart', 'payment', 'success'
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [loading, setLoading] = useState(false);

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState("UPI"); // 'UPI', 'Card', 'Net Banking'
  const [upiApp, setUpiApp] = useState("gpay"); // 'gpay', 'phonepe', 'paytm', 'qr'
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("SBI");

  // Order & Transaction Details
  const [txnId, setTxnId] = useState("");
  const [orderId, setOrderId] = useState("");

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  // Reset steps when drawer is closed
  useEffect(() => {
    if (!isOpen) {
      setStep("cart");
      setLoading(false);
    }
  }, [isOpen]);

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (
      cart.length === 0 ||
      !customerName ||
      !customerPhone ||
      !deliveryAddress
    )
      return;
    setStep("payment");
  };

  const getPaymentMethodLabel = () => {
    if (paymentMethod === "UPI") {
      const appLabels = {
        gpay: "Google Pay",
        phonepe: "PhonePe",
        paytm: "Paytm",
        qr: "QR Code Scan",
      };
      return `UPI (${appLabels[upiApp] || "UPI"})`;
    }
    if (paymentMethod === "Card") {
      return "Credit/Debit Card";
    }
    return `Net Banking (${selectedBank})`;
  };

  const handlePayAndSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate payment processing delay (1.5s)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate simulated Transaction ID
    const generatedTxnId =
      "TXN-SS-" +
      Date.now().toString().slice(-8) +
      Math.floor(1000 + Math.random() * 9000);
    setTxnId(generatedTxnId);

    const paymentMethodLabel = getPaymentMethodLabel();

    // Helper to generate a client-side fallback Order ID (matching SS-DDMMHHMM-XXX format)
    const generateFallbackOrderId = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const suffix = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
      return `SS-${day}${month}${hours}${minutes}-${suffix}`;
    };

    try {
      // Submit order to backend
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          customerPhone,
          deliveryAddress,
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
          })),
          totalAmount,
          paymentStatus: "Paid",
          paymentMethod: paymentMethodLabel,
          transactionId: generatedTxnId,
        }),
      });

      const data = await response.json();

      if (data && data.success && data.order && data.order.id) {
        setOrderId(data.order.id);
      } else {
        console.warn("Backend order creation returned unsuccessful, using fallback local ID.");
        setOrderId(generateFallbackOrderId());
      }
      setStep("success");
    } catch (err) {
      console.error("Error connecting to database to register order. Using fallback local ID:", err);
      setOrderId(generateFallbackOrderId());
      setStep("success");
    }
  };

  const handleOpenWhatsApp = () => {
    const paymentMethodLabel = getPaymentMethodLabel();

    let waText = `🍱 *SS HOMEMADE FOOD - PAID ORDER*\n`;
    waText += `------------------------------------\n`;
    waText += `*Order ID:* #${orderId}\n`;
    waText += `*Date:* ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    waText += `------------------------------------\n`;
    waText += `*Customer Details:*\n`;
    waText += `👤 Name: ${customerName}\n`;
    waText += `📞 Phone: ${customerPhone}\n\n`;
    waText += `*Items Ordered:*\n`;

    cart.forEach((item, index) => {
      waText += `${index + 1}. ${item.name} x ${item.qty} = ₹${item.price * item.qty}\n`;
    });

    waText += `------------------------------------\n`;
    waText += `💰 *Grand Total: ₹${totalAmount}*\n`;
    waText += `💳 *Payment Status:* PAID via ${paymentMethodLabel}\n`;
    waText += `🔑 *Transaction ID:* ${txnId}\n`;
    waText += `------------------------------------\n`;
    waText += `📍 *Delivery Address:*\n${deliveryAddress}\n\n`;
    waText += `_Please confirm my paid order and share the delivery time. Thank you!_`;

    const encodedText = encodeURIComponent(waText);
    const waUrl = `https://wa.me/919360198417?text=${encodedText}`;

    // Clear cart and state locally
    onClearCart();
    setCustomerName("");
    setCustomerPhone("");
    setDeliveryAddress("");
    onClose();

    // Redirect to WhatsApp
    window.open(waUrl, "_blank");
  };

  // Auto-format card number
  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = val.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(" "));
    } else {
      setCardNumber(val);
    }
  };

  // Auto-format card expiry (MM/YY)
  const handleCardExpiryChange = (e) => {
    let val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length >= 2) {
      val = val.substring(0, 2) + "/" + val.substring(2, 4);
    }
    setCardExpiry(val.substring(0, 5));
  };

  return (
    <div
      className={`cart-drawer-backdrop ${isOpen ? "open" : ""}`}
      onClick={onClose}
    >
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Step 1: Cart Items & Delivery Details */}
        {step === "cart" && (
          <>
            <div className="cart-header">
              <h3>Your Basket 🛒</h3>
              <button className="close-cart-btn" onClick={onClose}>
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart-msg">
                <p>Your cart is empty.</p>
                <p style={{ fontSize: "0.85rem", marginTop: "10px" }}>
                  Explore the menu to add delicious homemade dishes!
                </p>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <h4>{item.name}</h4>
                        <span>
                          ₹{item.price} x {item.qty} = ₹{item.price * item.qty}
                        </span>
                      </div>
                      <div className="qty-control">
                        <button
                          className="qty-btn"
                          onClick={() => onUpdateQty(item, item.qty - 1)}
                        >
                          −
                        </button>
                        <span className="qty-val">{item.qty}</span>
                        <button
                          className="qty-btn"
                          onClick={() => onUpdateQty(item, item.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-total-section">
                  <div className="total-row">
                    <span>Total Amount:</span>
                    <span>₹{totalAmount}</span>
                  </div>

                  <form
                    className="checkout-form"
                    onSubmit={handleProceedToPayment}
                  >
                    <h4>Delivery Details</h4>

                    <div className="form-group">
                      <label htmlFor="cust-name">Name *</label>
                      <input
                        id="cust-name"
                        type="text"
                        required
                        placeholder="Enter your name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="cust-phone">Phone Number *</label>
                      <input
                        id="cust-phone"
                        type="tel"
                        required
                        placeholder="Enter 10-digit mobile number"
                        pattern="[0-9]{10}"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="cust-addr">Delivery Address *</label>
                      <textarea
                        id="cust-addr"
                        required
                        rows="3"
                        placeholder="Flat/House No, Building, Street, Pammal/Pozhichalur, Chennai"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                      ></textarea>
                    </div>

                    <button type="submit" className="order-btn">
                      Proceed to Payment 💳
                    </button>
                  </form>
                </div>
              </>
            )}
          </>
        )}

        {/* Step 2: Online Payment Page */}
        {step === "payment" && (
          <>
            <div className="cart-header">
              <h3>Secure Checkout 🔒</h3>
              <button
                className="close-cart-btn"
                onClick={() => setStep("cart")}
              >
                ←
              </button>
            </div>

            <div className="payment-container">
              <div className="payment-summary-box">
                <span>Amount to Pay:</span>
                <span className="payment-amount">₹{totalAmount}</span>
              </div>

              {/* Payment Tabs */}
              <div className="payment-tabs">
                <button
                  className={`payment-tab-btn ${paymentMethod === "UPI" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("UPI")}
                >
                  📱 UPI
                </button>
                <button
                  className={`payment-tab-btn ${paymentMethod === "Card" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("Card")}
                >
                  💳 Card
                </button>
                <button
                  className={`payment-tab-btn ${paymentMethod === "Net Banking" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("Net Banking")}
                >
                  🏛️ Net Banking
                </button>
              </div>

              <form onSubmit={handlePayAndSubmitOrder} className="payment-form">
                {/* UPI Content */}
                {paymentMethod === "UPI" && (
                  <div className="payment-tab-content">
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        marginBottom: "15px",
                      }}
                    >
                      Select your preferred UPI app or scan the QR code:
                    </p>

                    <div className="upi-options-grid">
                      <div
                        className={`upi-option-card ${upiApp === "gpay" ? "selected" : ""}`}
                        onClick={() => setUpiApp("gpay")}
                      >
                        <span className="upi-logo gpay">GPay</span>
                        <span>Google Pay</span>
                      </div>
                      <div
                        className={`upi-option-card ${upiApp === "phonepe" ? "selected" : ""}`}
                        onClick={() => setUpiApp("phonepe")}
                      >
                        <span className="upi-logo phonepe">Pe</span>
                        <span>PhonePe</span>
                      </div>
                      <div
                        className={`upi-option-card ${upiApp === "paytm" ? "selected" : ""}`}
                        onClick={() => setUpiApp("paytm")}
                      >
                        <span className="upi-logo paytm">Paytm</span>
                        <span>Paytm</span>
                      </div>
                      <div
                        className={`upi-option-card ${upiApp === "qr" ? "selected" : ""}`}
                        onClick={() => setUpiApp("qr")}
                      >
                        <span className="upi-logo qr">QR</span>
                        <span>QR Code</span>
                      </div>
                    </div>

                    {upiApp === "qr" ? (
                      <div className="upi-qr-box">
                        <div className="mock-qr-code">
                          {/* Simulated QR Code graphic using CSS */}
                          <div className="qr-inner">
                            <div className="qr-corner top-left"></div>
                            <div className="qr-corner top-right"></div>
                            <div className="qr-corner bottom-left"></div>
                            <div className="qr-pixel-grid"></div>
                          </div>
                        </div>
                        <p
                          style={{
                            fontSize: "0.8rem",
                            marginTop: "10px",
                            color: "var(--text-main)",
                            fontWeight: "bold",
                          }}
                        >
                          SS HOMEMADE FOOD UPI QR
                        </p>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Scan using GPay, PhonePe, or Paytm to pay
                        </p>
                      </div>
                    ) : (
                      <div className="form-group" style={{ marginTop: "15px" }}>
                        <label>UPI ID / VPA</label>
                        <input
                          type="text"
                          placeholder="username@okaxis"
                          defaultValue={`${customerPhone || "9876543210"}@okaxis`}
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Card Content */}
                {paymentMethod === "Card" && (
                  <div className="payment-tab-content">
                    <div className="form-group">
                      <label>Card Number</label>
                      <input
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        maxLength="19"
                        required
                      />
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "15px",
                      }}
                    >
                      <div className="form-group">
                        <label>Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={handleCardExpiryChange}
                          maxLength="5"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>CVV</label>
                        <input
                          type="password"
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) =>
                            setCardCvv(
                              e.target.value
                                .replace(/[^0-9]/g, "")
                                .substring(0, 3),
                            )
                          }
                          maxLength="3"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="Enter name on card"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Net Banking Content */}
                {paymentMethod === "Net Banking" && (
                  <div className="payment-tab-content">
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        marginBottom: "15px",
                      }}
                    >
                      Select your bank from the list:
                    </p>
                    <div className="bank-options-grid">
                      {["SBI", "HDFC", "ICICI", "AXIS"].map((bank) => (
                        <div
                          key={bank}
                          className={`bank-option-card ${selectedBank === bank ? "selected" : ""}`}
                          onClick={() => setSelectedBank(bank)}
                        >
                          <span className="bank-icon">🏛️</span>
                          <span style={{ fontWeight: 600 }}>{bank}</span>
                        </div>
                      ))}
                    </div>
                    <div className="form-group" style={{ marginTop: "15px" }}>
                      <label>Or select other bank</label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <option value="SBI">State Bank of India</option>
                        <option value="HDFC">HDFC Bank</option>
                        <option value="ICICI">ICICI Bank</option>
                        <option value="AXIS">Axis Bank</option>
                        <option value="KOTAK">Kotak Mahindra Bank</option>
                        <option value="PNB">Punjab National Bank</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="order-btn"
                  style={{ marginTop: "20px" }}
                  disabled={loading}
                >
                  {loading
                    ? "Processing Payment..."
                    : `Pay ₹${totalAmount} Now 🔒`}
                </button>
              </form>

              <button
                className="back-btn"
                style={{
                  marginTop: "15px",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  textDecoration: "underline",
                  width: "100%",
                  textAlign: "center",
                }}
                onClick={() => setStep("cart")}
                disabled={loading}
              >
                Go back to Delivery Details
              </button>
            </div>
          </>
        )}

        {/* Step 3: Payment Success Screen */}
        {step === "success" && (
          <div className="payment-success-container">
            <div className="success-icon-box">
              <div className="success-checkmark">
                <div className="check-icon"></div>
              </div>
            </div>

            <h2>Payment Successful! 🎉</h2>
            <p className="success-msg">
              Thank you, <strong>{customerName}</strong>! Your online payment of{" "}
              <strong>₹{totalAmount}</strong> has been processed successfully.
            </p>

            <div className="success-details-card">
              <div className="success-detail-row">
                <span>Order ID:</span>
                <span style={{ fontWeight: "bold", color: "var(--primary)" }}>
                  #{orderId}
                </span>
              </div>
              <div className="success-detail-row">
                <span>Payment Method:</span>
                <span>{getPaymentMethodLabel()}</span>
              </div>
              <div className="success-detail-row">
                <span>Transaction ID:</span>
                <code
                  style={{
                    fontSize: "0.8rem",
                    background: "#eee",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  {txnId}
                </code>
              </div>
            </div>

            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                margin: "20px 0",
              }}
            >
              Click below to send your paid order receipt to SS Homemade Food
              via WhatsApp to finalize preparation and delivery.
            </p>

            <button className="order-btn" onClick={handleOpenWhatsApp}>
              Send Receipt via WhatsApp 💬
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
