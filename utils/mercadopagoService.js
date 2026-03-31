const mercadopago = require('mercadopago');
const Setting = require('../models/Setting');

let accessToken = null;

async function getAccessToken() {
  if (accessToken) return accessToken;
  const setting = await Setting.findOne();
  accessToken = setting && setting.mercadoPagoAccessToken ? setting.mercadoPagoAccessToken : null;
  return accessToken;
}

function clearAccessTokenCache() {
  accessToken = null;
}

async function configureMercadoPago() {
  const token = await getAccessToken();
  if (token) {
    mercadopago.configurations.setAccessToken(token);
  }
}

async function createPaymentPreference({ title, description, price, quantity = 1, externalReference, notificationUrl }) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('MercadoPago Access Token não configurado');
  }

  await configureMercadoPago();

  const preference = {
    items: [
      {
        title: title,
        description: description,
        unit_price: parseFloat(price),
        quantity: quantity,
        currency_id: 'BRL'
      }
    ],
    external_reference: externalReference,
    payment_methods: {
      excluded_payment_methods: [],
      excluded_payment_types: [],
      installments: 12
    },
    back_urls: {
      success: notificationUrl + '?status=success',
      failure: notificationUrl + '?status=failure',
      pending: notificationUrl + '?status=pending'
    },
    auto_return: 'approved'
  };

  const response = await mercadopago.preferences.create(preference);
  return response.body;
}

async function getPaymentInfo(paymentId) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('MercadoPago Access Token não configurado');
  }

  await configureMercadoPago();
  const payment = await mercadopago.payment.findById(paymentId);
  return payment.body;
}

async function getMerchantOrder(merchantOrderId) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('MercadoPago Access Token não configurado');
  }

  await configureMercadoPago();
  const order = await mercadopago.merchant_orders.findById(merchantOrderId);
  return order.body;
}

module.exports = {
  getAccessToken,
  clearAccessTokenCache,
  configureMercadoPago,
  createPaymentPreference,
  getPaymentInfo,
  getMerchantOrder
};
