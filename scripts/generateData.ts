import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Utility functions
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const weighted = (choices: [string, number][]): string => {
  const total = choices.reduce((sum, [, weight]) => sum + weight, 0)
  let random = Math.random() * total
  for (const [value, weight] of choices) {
    if (random < weight) return value
    random -= weight
  }
  return choices[0][0]
}

// Date generation
const randomDate = (start: Date, end: Date): string => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString()
}

const recentDate = (daysAgo: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - randomInt(0, daysAgo))
  return date.toISOString()
}

// City/State data
const US_CITIES = [
  { city: 'New York', state: 'NY' }, { city: 'Los Angeles', state: 'CA' },
  { city: 'Chicago', state: 'IL' }, { city: 'Houston', state: 'TX' },
  { city: 'Phoenix', state: 'AZ' }, { city: 'Philadelphia', state: 'PA' },
  { city: 'San Antonio', state: 'TX' }, { city: 'San Diego', state: 'CA' },
  { city: 'Dallas', state: 'TX' }, { city: 'San Jose', state: 'CA' },
  { city: 'Austin', state: 'TX' }, { city: 'Jacksonville', state: 'FL' },
  { city: 'Seattle', state: 'WA' }, { city: 'Denver', state: 'CO' }, { city: 'Boston', state: 'MA' }
]

const AIRPORTS = ['JFK', 'LAX', 'ORD', 'DFW', 'DEN', 'ATL', 'SFO', 'SEA', 'LAS', 'MCO', 'EWR', 'CLT', 'PHX', 'IAH', 'MIA']

// E-Commerce Data Generator
function generateEcommerceCustomers(count: number) {
  const customers = []
  const categories = ['electronics', 'clothing', 'home', 'beauty', 'sports', 'books']

  for (let i = 0; i < count; i++) {
    const customerId = `ecom_${String(i + 1).padStart(5, '0')}`
    const location = randomChoice(US_CITIES)
    const tier = weighted([['bronze', 60], ['silver', 25], ['gold', 12], ['platinum', 3]])
    const signupDate = randomDate(new Date('2020-01-01'), new Date('2024-10-01'))
    const age = Math.max(18, Math.min(75, Math.round(35 + (Math.random() + Math.random() + Math.random() - 1.5) * 15)))

    const totalOrders = Math.round(1 + Math.pow(Math.random(), 1.5) * 50)
    const lifetimeValue = Math.round(totalOrders * randomFloat(30, 200) * 100) / 100
    const avgOrderValue = Math.round((lifetimeValue / totalOrders) * 100) / 100

    // Nested facts
    const facts = {
      customerProfile: {
        customer_id: customerId,
        email: `customer${i + 1}@example.com`,
        phone_number: `${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
        age,
        gender: randomChoice(['male', 'female', 'non-binary', 'prefer-not-to-say']),
        location_city: location.city,
        location_state: location.state,
        signup_date: signupDate,
        email_subscribed: Math.random() > 0.3
      },
      membershipStatus: {
        tier,
        points_balance: randomInt(0, 10000),
        lifetime_points: randomInt(1000, 50000),
        tier_expiration_date: randomDate(new Date('2025-01-01'), new Date('2025-12-31')),
        next_tier: tier === 'bronze' ? 'silver' : tier === 'silver' ? 'gold' : tier === 'gold' ? 'platinum' : 'platinum',
        points_to_next_tier: randomInt(100, 5000)
      },
      purchaseHistory: {
        total_orders: totalOrders,
        lifetime_value: lifetimeValue,
        average_order_value: avgOrderValue,
        last_purchase_date: recentDate(365),
        first_purchase_date: signupDate,
        preferred_category: randomChoice(categories),
        return_rate: Math.round(randomFloat(0, 25) * 100) / 100
      },
      engagementMetrics: {
        total_site_visits: randomInt(totalOrders, totalOrders * 10),
        last_visit_date: recentDate(30),
        average_session_duration: randomInt(60, 600),
        product_views: randomInt(totalOrders * 5, totalOrders * 20),
        cart_abandonment_rate: Math.round(randomFloat(10, 40) * 100) / 100,
        email_open_rate: Math.round(randomFloat(15, 45) * 100) / 100,
        review_count: randomInt(0, Math.floor(totalOrders / 3))
      }
    }

    // Generate engagements
    const engagementCount = Math.round(5 + Math.pow(Math.random(), 1.5) * 45)
    const engagements = []

    for (let j = 0; j < engagementCount; j++) {
      const engagementType = weighted([
        ['purchase', 25], ['productView', 35], ['siteVisit', 20],
        ['emailOpen', 10], ['emailClick', 5], ['cartAbandonment', 3], ['productReview', 2]
      ])
      const timestamp = recentDate(365)

      if (engagementType === 'purchase') {
        engagements.push({
          type: 'purchase',
          timestamp,
          properties: {
            order_id: `ORD_${randomInt(10000, 99999)}`,
            amount: Math.round(randomFloat(10, 500) * 100) / 100,
            product_id: `PROD_${randomInt(1000, 9999)}`,
            product_name: `Product ${randomInt(1, 100)}`,
            category: randomChoice(categories),
            quantity: randomInt(1, 5),
            discount_applied: Math.round(randomFloat(0, 50) * 100) / 100,
            payment_method: randomChoice(['credit-card', 'debit-card', 'paypal', 'apple-pay', 'google-pay'])
          }
        })
      } else if (engagementType === 'productView') {
        engagements.push({
          type: 'productView',
          timestamp,
          properties: {
            product_id: `PROD_${randomInt(1000, 9999)}`,
            product_name: `Product ${randomInt(1, 100)}`,
            category: randomChoice(categories),
            price: Math.round(randomFloat(10, 500) * 100) / 100,
            time_on_page: randomInt(10, 300),
            added_to_cart: Math.random() > 0.6
          }
        })
      } else if (engagementType === 'siteVisit') {
        engagements.push({
          type: 'siteVisit',
          timestamp,
          properties: {
            session_id: `SES_${randomInt(10000, 99999)}`,
            duration: randomInt(30, 1800),
            pages_viewed: randomInt(1, 15),
            source: randomChoice(['direct', 'organic', 'paid', 'social', 'email', 'referral']),
            device: randomChoice(['desktop', 'mobile', 'tablet']),
            entry_page: randomChoice(['/home', '/products', '/sale', '/category/electronics'])
          }
        })
      } else if (engagementType === 'emailOpen') {
        engagements.push({
          type: 'emailOpen',
          timestamp,
          properties: {
            campaign_id: `CAMP_${randomInt(100, 999)}`,
            subject: randomChoice(['Weekly Deals', 'New Arrivals', 'Flash Sale', 'Member Exclusive']),
            campaign_type: randomChoice(['promotional', 'transactional', 'newsletter', 'abandoned-cart']),
            device: randomChoice(['desktop', 'mobile', 'tablet'])
          }
        })
      } else if (engagementType === 'emailClick') {
        engagements.push({
          type: 'emailClick',
          timestamp,
          properties: {
            campaign_id: `CAMP_${randomInt(100, 999)}`,
            link_url: randomChoice(['/products', '/sale', '/new-arrivals', '/categories']),
            link_text: randomChoice(['Shop Now', 'View Products', 'Learn More', 'Get Offer']),
            position: randomChoice(['header', 'body', 'footer'])
          }
        })
      } else if (engagementType === 'cartAbandonment') {
        engagements.push({
          type: 'cartAbandonment',
          timestamp,
          properties: {
            cart_id: `CART_${randomInt(10000, 99999)}`,
            cart_value: Math.round(randomFloat(20, 300) * 100) / 100,
            item_count: randomInt(1, 8),
            abandonment_stage: randomChoice(['cart', 'shipping', 'payment', 'review']),
            recovered: Math.random() > 0.7
          }
        })
      } else if (engagementType === 'productReview') {
        engagements.push({
          type: 'productReview',
          timestamp,
          properties: {
            review_id: `REV_${randomInt(10000, 99999)}`,
            product_id: `PROD_${randomInt(1000, 9999)}`,
            rating: randomInt(1, 5),
            has_text: Math.random() > 0.3,
            verified_purchase: Math.random() > 0.2
          }
        })
      }
    }

    customers.push({
      id: customerId,
      facts,
      engagements: engagements.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    })
  }

  return customers
}

// Airlines Data Generator
function generateAirlinesCustomers(count: number) {
  const customers = []

  for (let i = 0; i < count; i++) {
    const customerId = `air_${String(i + 1).padStart(5, '0')}`
    const tier = weighted([['basic', 70], ['silver', 20], ['gold', 8], ['platinum', 2]])
    const memberSince = randomDate(new Date('2015-01-01'), new Date('2024-01-01'))
    const age = Math.max(21, Math.min(75, Math.round(35 + (Math.random() + Math.random() + Math.random() - 1.5) * 18)))

    const totalBookings = Math.round(2 + Math.pow(Math.random(), 1.3) * 30)
    const lifetimeMiles = Math.round(Math.pow(Math.random(), 2) * 200000)
    const milesBalance = Math.round(lifetimeMiles * randomFloat(0.1, 0.5))

    const facts = {
      customerProfile: {
        customer_id: customerId,
        email: `flyer${i + 1}@example.com`,
        phone_number: `${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
        home_airport: randomChoice(AIRPORTS),
        country: weighted([['USA', 80], ['Canada', 10], ['UK', 5], ['Australia', 3], ['Germany', 2]]),
        age,
        member_since: memberSince,
        preferred_language: randomChoice(['English', 'Spanish', 'French', 'German']),
        email_subscribed: Math.random() > 0.25
      },
      loyaltyMetrics: {
        loyalty_tier: tier,
        miles_balance: milesBalance,
        lifetime_miles: lifetimeMiles,
        qualification_miles: randomInt(0, 25000),
        tier_expiration_date: randomDate(new Date('2025-01-01'), new Date('2025-12-31')),
        lifetime_flights: totalBookings + randomInt(0, 10),
        partner_miles: Math.round(lifetimeMiles * randomFloat(0, 0.3))
      },
      travelPreferences: {
        preferred_class: weighted([['economy', 65], ['premium-economy', 20], ['business', 12], ['first', 3]]),
        seat_preference: randomChoice(['window', 'aisle', 'middle']),
        meal_preference: randomChoice(['Standard', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Kosher']),
        special_assistance: randomChoice(['None', 'Wheelchair', 'Visual Impairment', 'Hearing Impairment']),
        average_trips_per_year: Math.round(totalBookings / 3),
        most_visited_destination: randomChoice(AIRPORTS)
      },
      bookingMetrics: {
        total_bookings: totalBookings,
        total_amount_spent: Math.round(totalBookings * randomFloat(300, 1500) * 100) / 100,
        average_booking_value: Math.round(randomFloat(300, 1500) * 100) / 100,
        last_booking_date: recentDate(180),
        booking_lead_time: randomInt(1, 60),
        cancellation_rate: Math.round(randomFloat(0, 15) * 100) / 100,
        round_trip_percentage: Math.round(randomFloat(50, 90) * 100) / 100
      }
    }

    const engagementCount = Math.round(10 + Math.pow(Math.random(), 1.2) * 40)
    const engagements = []

    for (let j = 0; j < engagementCount; j++) {
      const engagementType = weighted([
        ['flightBooking', 20], ['flightCompletion', 20], ['checkin', 15],
        ['appLogin', 25], ['loungeVisit', 5], ['seatUpgrade', 5], ['milesRedemption', 10]
      ])
      const timestamp = recentDate(730)

      if (engagementType === 'flightBooking') {
        const origin = randomChoice(AIRPORTS)
        let destination = randomChoice(AIRPORTS)
        while (destination === origin) destination = randomChoice(AIRPORTS)

        engagements.push({
          type: 'flightBooking',
          timestamp,
          properties: {
            EventDate: timestamp,
            JobId: `JOB_${randomInt(10000, 99999)}`,
            JourneyName: `Journey_${randomInt(100, 999)}`,
            SubscriberKey: `SUB_${randomInt(10000, 99999)}`,
            TriggeredSendCustomerKey: `TSCK_${randomInt(10000, 99999)}`,
            booking_id: `BKG_${randomInt(100000, 999999)}`,
            origin,
            destination,
            price: Math.round(randomFloat(150, 1500) * 100) / 100,
            class: weighted([['economy', 70], ['premium-economy', 15], ['business', 12], ['first', 3]]),
            is_round_trip: Math.random() > 0.3,
            departure_date: randomDate(new Date(), new Date(Date.now() + 180 * 24 * 60 * 60 * 1000))
          }
        })
      } else if (engagementType === 'flightCompletion') {
        const origin = randomChoice(AIRPORTS)
        let destination = randomChoice(AIRPORTS)
        while (destination === origin) destination = randomChoice(AIRPORTS)

        engagements.push({
          type: 'flightCompletion',
          timestamp,
          properties: {
            flight_id: `FLT_${randomInt(1000, 9999)}`,
            origin,
            destination,
            miles: randomInt(300, 3000),
            miles_earned: randomInt(300, 5000),
            on_time: Math.random() > 0.2,
            delay_minutes: randomInt(0, 120)
          }
        })
      } else if (engagementType === 'seatUpgrade') {
        const classes = ['economy', 'premium-economy', 'business', 'first']
        const fromIndex = randomInt(0, 2)
        const toIndex = randomInt(fromIndex + 1, 3)

        engagements.push({
          type: 'seatUpgrade',
          timestamp,
          properties: {
            upgrade_id: `UPG_${randomInt(10000, 99999)}`,
            from_class: classes[fromIndex],
            to_class: classes[toIndex],
            price: Math.round(randomFloat(50, 800) * 100) / 100,
            miles_used: randomInt(0, 25000),
            flight_id: `FLT_${randomInt(1000, 9999)}`
          }
        })
      } else if (engagementType === 'loungeVisit') {
        engagements.push({
          type: 'loungeVisit',
          timestamp,
          properties: {
            visit_id: `VIS_${randomInt(10000, 99999)}`,
            airport: randomChoice(AIRPORTS),
            lounge_name: randomChoice(['Sky Club', 'Admirals Club', 'United Club', 'Centurion Lounge']),
            duration: randomInt(30, 180),
            access_method: randomChoice(['tier-status', 'day-pass', 'credit-card', 'paid'])
          }
        })
      } else if (engagementType === 'appLogin') {
        engagements.push({
          type: 'appLogin',
          timestamp,
          properties: {
            session_id: `SES_${randomInt(10000, 99999)}`,
            device: randomChoice(['iOS', 'Android']),
            session_duration: randomInt(30, 600),
            features_accessed: randomChoice(['booking', 'check-in', 'miles', 'profile']),
            location: randomChoice(US_CITIES).city
          }
        })
      } else if (engagementType === 'milesRedemption') {
        engagements.push({
          type: 'milesRedemption',
          timestamp,
          properties: {
            redemption_id: `RED_${randomInt(10000, 99999)}`,
            miles_used: randomInt(5000, 50000),
            redemption_type: randomChoice(['flight', 'upgrade', 'merchandise', 'partner', 'donation']),
            estimated_value: Math.round(randomFloat(50, 500) * 100) / 100
          }
        })
      } else if (engagementType === 'checkin') {
        engagements.push({
          type: 'checkin',
          timestamp,
          properties: {
            checkin_id: `CHK_${randomInt(10000, 99999)}`,
            method: randomChoice(['mobile', 'web', 'kiosk', 'counter']),
            hours_before_flight: randomInt(1, 24),
            seat_selected: `${randomChoice(['A', 'B', 'C', 'D', 'E', 'F'])}${randomInt(1, 30)}`,
            baggage_count: randomInt(0, 3)
          }
        })
      }
    }

    customers.push({
      id: customerId,
      facts,
      engagements: engagements.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    })
  }

  return customers
}

// Insurance Data Generator
function generateInsuranceCustomers(count: number) {
  const customers = []
  const US_STATES = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA']

  for (let i = 0; i < count; i++) {
    const customerId = `ins_${String(i + 1).padStart(5, '0')}`
    const policyType = weighted([['auto', 50], ['home', 30], ['life', 15], ['health', 5]])
    const customerSince = randomDate(new Date('2015-01-01'), new Date('2024-01-01'))
    const age = Math.max(25, Math.min(75, Math.round(40 + (Math.random() + Math.random() + Math.random() - 1.5) * 15)))
    const riskScore = Math.max(300, Math.min(850, Math.round(575 + (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 100)))

    const totalClaims = weighted([['0', 60], ['1', 20], ['2', 10], ['3', 5], ['4+', 5]]) === '4+' ? randomInt(4, 8) : parseInt(weighted([['0', 60], ['1', 20], ['2', 10], ['3', 5]]))

    const facts = {
      client: {
        agent_id: `AGT_${randomInt(1000, 9999)}`,
        agent_network_type: randomChoice(['independent', 'captive', 'exclusive']),
        agent_type: randomChoice(['broker', 'agent', 'direct']),
        agent_zone: randomChoice(['North', 'South', 'East', 'West', 'Central']),
        car_category_code: randomChoice(['A', 'B', 'C', 'D', 'E']),
        car_license_plate: `${randomChoice(['A', 'B', 'C'])}${randomInt(100, 999)}${randomChoice(['XYZ', 'ABC', 'DEF'])}`,
        car_license_plate_age: randomInt(0, 15),
        car_license_plate_month: randomInt(1, 12),
        client_email: `insurance${i + 1}@example.com`,
        client_fiscal_number: `${randomInt(100, 999)}-${randomInt(10, 99)}-${randomInt(1000, 9999)}`,
        client_id: customerId,
        client_phone_number: `${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
        multi_id: Math.random() > 0.7 ? `MULTI_${randomInt(1000, 9999)}` : '',
        multi_type: Math.random() > 0.7 ? randomChoice(['auto-home', 'auto-life', 'home-life']) : '',
        policy_collection_type: randomChoice(['direct-debit', 'credit-card', 'bank-transfer', 'check'])
      },
      policyMetrics: {
        policy_id: `POL_${randomInt(100000, 999999)}`,
        policy_type: policyType,
        policy_status: weighted([['active', 85], ['expired', 5], ['cancelled', 5], ['pending', 5]]),
        coverage_amount: Math.round(randomFloat(50000, 1000000) / 10000) * 10000,
        premium_amount: Math.round(randomFloat(50, 500) * 100) / 100,
        deductible: randomChoice([250, 500, 1000, 2500, 5000]),
        policy_start_date: customerSince,
        policy_end_date: randomDate(new Date('2025-01-01'), new Date('2026-12-31')),
        renewal_date: randomDate(new Date('2025-01-01'), new Date('2025-12-31')),
        payment_frequency: randomChoice(['monthly', 'quarterly', 'annually']),
        auto_renew_enabled: Math.random() > 0.4
      },
      claimMetrics: {
        total_claims: totalClaims,
        total_claim_amount: Math.round(totalClaims * randomFloat(1000, 15000) * 100) / 100,
        total_paid_amount: Math.round(totalClaims * randomFloat(800, 12000) * 100) / 100,
        last_claim_date: totalClaims > 0 ? recentDate(730) : '',
        claim_frequency_score: Math.round((totalClaims / 5) * 100) / 100,
        pending_claims: randomInt(0, Math.min(2, totalClaims)),
        denied_claims: randomInt(0, Math.floor(totalClaims / 3)),
        fraud_flags: randomInt(0, Math.min(1, totalClaims))
      },
      invoiceMetrics: {
        total_invoices: randomInt(12, 120),
        total_amount_invoiced: Math.round(randomFloat(5000, 50000) * 100) / 100,
        total_amount_paid: Math.round(randomFloat(4500, 48000) * 100) / 100,
        outstanding_balance: Math.round(randomFloat(0, 2000) * 100) / 100,
        last_payment_date: recentDate(60),
        last_payment_amount: Math.round(randomFloat(50, 500) * 100) / 100,
        payment_method: randomChoice(['credit-card', 'debit-card', 'bank-transfer', 'check']),
        late_payments: randomInt(0, 5),
        payment_score: randomInt(50, 100)
      },
      riskProfile: {
        risk_score: riskScore,
        credit_score: randomInt(300, 850),
        driving_record_score: randomInt(50, 100),
        accident_history: randomInt(0, 5),
        violation_history: randomInt(0, 8),
        home_age: randomInt(0, 100),
        location_risk_level: weighted([['low', 40], ['medium', 35], ['high', 20], ['very-high', 5]])
      }
    }

    const engagementCount = randomInt(10, 40)
    const engagements = []

    // Add claims
    for (let j = 0; j < totalClaims; j++) {
      engagements.push({
        type: 'claim',
        timestamp: recentDate(730),
        properties: {
          claim_date: recentDate(730),
          claim_id: `CLM_${randomInt(100000, 999999)}`,
          claim_location: randomChoice(US_CITIES).city,
          claim_management_area: randomChoice(['North', 'South', 'East', 'West']),
          claim_provisions: Math.round(randomFloat(1000, 25000) * 100) / 100,
          claim_status: weighted([['paid', 60], ['approved', 15], ['under-review', 10], ['denied', 10], ['submitted', 5]]),
          claim_status_date: recentDate(365),
          claim_submission_date: recentDate(730),
          client_id: customerId,
          ids_type: randomChoice(['SSN', 'TaxID', 'PassportID']),
          policy_id: `POL_${randomInt(100000, 999999)}`,
          product_id: `PROD_${randomInt(1000, 9999)}`,
          claim_amount: Math.round(randomFloat(500, 25000) * 100) / 100,
          approved_amount: Math.round(randomFloat(400, 22000) * 100) / 100
        }
      })
    }

    // Add other engagements
    for (let j = 0; j < engagementCount - totalClaims; j++) {
      const engagementType = weighted([
        ['portalLogin', 30], ['paymentMade', 20], ['policyRenewal', 10],
        ['quoteRequest', 15], ['emailOpen', 15], ['carPolicy', 10]
      ])
      const timestamp = recentDate(365)

      if (engagementType === 'emailOpen') {
        engagements.push({
          type: 'emailOpen',
          timestamp,
          properties: {
            EventDate: timestamp,
            JobId: `JOB_${randomInt(10000, 99999)}`,
            JourneyName: randomChoice(['Welcome', 'Renewal Reminder', 'Policy Update', 'Newsletter']),
            SubscriberKey: `SUB_${randomInt(10000, 99999)}`,
            TriggeredSendCustomerKey: `TSCK_${randomInt(10000, 99999)}`,
            EmailSubject: randomChoice(['Policy Renewal Notice', 'Important Update', 'Your Monthly Statement']),
            CampaignID: `CAMP_${randomInt(100, 999)}`
          }
        })
      } else if (engagementType === 'carPolicy') {
        engagements.push({
          type: 'carPolicy',
          timestamp,
          properties: {
            agent_id: `AGT_${randomInt(1000, 9999)}`,
            agent_network_type: randomChoice(['independent', 'captive', 'exclusive']),
            agent_type: randomChoice(['broker', 'agent', 'direct']),
            agent_zone: randomChoice(['North', 'South', 'East', 'West']),
            car_category_code: randomChoice(['A', 'B', 'C', 'D']),
            car_license_plate: `${randomChoice(['A', 'B'])}${randomInt(100, 999)}${randomChoice(['XYZ', 'ABC'])}`,
            car_license_plate_age: randomInt(0, 15),
            car_license_plate_month: randomInt(1, 12),
            client_email: `insurance${i + 1}@example.com`,
            client_fiscal_number: `${randomInt(100, 999)}-${randomInt(10, 99)}-${randomInt(1000, 9999)}`,
            client_id: customerId,
            client_phone_number: `${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
            multi_id: `MULTI_${randomInt(1000, 9999)}`,
            multi_type: randomChoice(['auto-home', 'auto-life']),
            policy_collection_type: randomChoice(['direct-debit', 'credit-card']),
            policy_premium: Math.round(randomFloat(50, 300) * 100) / 100,
            coverage_type: randomChoice(['liability', 'comprehensive', 'collision', 'full'])
          }
        })
      } else if (engagementType === 'portalLogin') {
        engagements.push({
          type: 'portalLogin',
          timestamp,
          properties: {
            device: randomChoice(['desktop', 'mobile', 'tablet']),
            session_duration: randomInt(60, 900),
            pages_viewed: randomInt(1, 10),
            ip_address: `${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`,
            login_location: randomChoice(US_CITIES).city
          }
        })
      } else if (engagementType === 'paymentMade') {
        engagements.push({
          type: 'paymentMade',
          timestamp,
          properties: {
            payment_id: `PAY_${randomInt(100000, 999999)}`,
            amount: Math.round(randomFloat(50, 500) * 100) / 100,
            method: randomChoice(['credit-card', 'debit-card', 'bank-transfer', 'check']),
            is_late: Math.random() < 0.1,
            policy_id: `POL_${randomInt(100000, 999999)}`,
            confirmation_number: `CONF_${randomInt(100000, 999999)}`
          }
        })
      } else if (engagementType === 'policyRenewal') {
        engagements.push({
          type: 'policyRenewal',
          timestamp,
          properties: {
            policy_id: `POL_${randomInt(100000, 999999)}`,
            policy_type: randomChoice(['auto', 'home', 'life', 'health']),
            previous_premium: Math.round(randomFloat(50, 400) * 100) / 100,
            new_premium: Math.round(randomFloat(60, 450) * 100) / 100,
            coverage_change: Math.round(randomFloat(-10000, 50000)),
            renewal_method: randomChoice(['auto', 'manual', 'agent-assisted'])
          }
        })
      } else if (engagementType === 'quoteRequest') {
        engagements.push({
          type: 'quoteRequest',
          timestamp,
          properties: {
            quote_id: `QTE_${randomInt(100000, 999999)}`,
            coverage_type: randomChoice(['auto', 'home', 'life', 'health', 'umbrella']),
            requested_amount: Math.round(randomFloat(50000, 500000) / 10000) * 10000,
            quoted_premium: Math.round(randomFloat(50, 400) * 100) / 100,
            converted: Math.random() < 0.3,
            quote_valid_until: randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
          }
        })
      }
    }

    customers.push({
      id: customerId,
      facts,
      engagements: engagements.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    })
  }

  return customers
}

// Generate and save data
console.log('Generating e-commerce customers...')
const ecommerceCustomers = generateEcommerceCustomers(500)
writeFileSync(
  join(__dirname, '../src/data/industries/ecommerce/customers.json'),
  JSON.stringify(ecommerceCustomers, null, 2)
)
console.log('✓ E-commerce: 500 customers generated with nested facts')

console.log('Generating airlines customers...')
const airlinesCustomers = generateAirlinesCustomers(500)
writeFileSync(
  join(__dirname, '../src/data/industries/airlines/customers.json'),
  JSON.stringify(airlinesCustomers, null, 2)
)
console.log('✓ Airlines: 500 customers generated with nested facts')

console.log('Generating insurance customers...')
const insuranceCustomers = generateInsuranceCustomers(500)
writeFileSync(
  join(__dirname, '../src/data/industries/insurance/customers.json'),
  JSON.stringify(insuranceCustomers, null, 2)
)
console.log('✓ Insurance: 500 customers generated with nested facts')

console.log('\nAll customer data generated successfully!')
console.log('Total customers: 1,500 with nested fact structures')
