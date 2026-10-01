// design: src/data/mya-faq.js — Mya’s Top-50 answers (product copy from the working draft), verbatim.
// Used for the dock’s starter questions, exact-question answers, and as the fallback when the
// backend chatbot is unavailable. The design’s HUB.MYA_SCRIPT (market statistics) is mock data
// and is not ported (D-022).

export interface MyaQa {
  q: string;
  a: string;
}

export const MYA_FAQ: readonly MyaQa[] = [
  {
    q: 'What is a WeO?',
    a: 'A WeO is a Wealth Exchange Offer — a digital offer to buy or sell in real time.',
  },
  {
    q: 'What can I do with a WeO?',
    a: 'You can use a WeO to buy or sell almost anything of value — products, services, experiences, events and more. Sellers can post what they’re offering, and buyers can post what they’re looking for. Either side can start the exchange.',
  },
  {
    q: 'Can I use a WeO to buy something, or is it just for selling?',
    a: "Both. A WeO can be an offer to sell or an offer to buy. If you want something, post what you're looking for, what you're willing to pay and when you need it. Sellers can respond to you.",
  },
  {
    q: 'How do I post a WeO?',
    a: "It's simple: say what you want to buy or sell, add your price and terms, and post it. You can then share your WeO across your networks and respond as people interact with it.",
  },
  {
    q: 'Where can I post or share my WeO?',
    a: 'You can share your WeO across the networks and communities where you already connect with people. A WeO is designed to travel with you, so your offer isn’t confined to one place.',
  },
  {
    q: 'How do people find my WeO?',
    a: 'People can discover your WeO in WeO or through the places you share it. You can post your WeO across your networks, so it can reach people wherever you already connect with them.',
  },
  {
    q: 'What does it mean to Collect a WeO?',
    a: "Collecting a WeO means you've accepted the offer and added it to your collection. From there, you can use it — or, when the WeO allows it, trade, resell or remix it.",
  },
  {
    q: 'What happens when someone Collects my WeO?',
    a: "You've made an exchange. The terms of your WeO are confirmed, and you and the collector move forward with whatever you agreed to — payment, delivery, timing or other terms.",
  },
  {
    q: 'Can someone negotiate my WeO?',
    a: 'Yes. You can make your WeO negotiable and let people respond with different terms or counteroffers. You decide whether to accept.',
  },
  {
    q: 'Can I change a WeO after I post it?',
    a: 'Yes. You can adjust a live WeO as your needs or the market changes. Once someone has collected it, the terms they agreed to are locked in.',
  },
  {
    q: 'What can I put in a WeO?',
    a: 'Almost anything you want to buy or sell — products, services, experiences, events, subscriptions and more. You set what’s being offered, the price, quantity, timing and other terms.',
  },
  {
    q: 'Do I have to set a fixed price?',
    a: 'No. You can set a price, allow negotiation, or create terms that let the price change with the offer. You decide how much flexibility you want when you post the WeO.',
  },
  {
    q: 'Can I limit how many are available or how long my WeO is live?',
    a: 'Yes. You can set the quantity and timing of your WeO. Offer one, offer 100, keep it open, or make it available for a limited time.',
  },
  {
    q: 'Can I share a WeO outside of WeO?',
    a: 'Yes. WeOs are made to be shared. You can post your WeO across your networks and bring people directly to your offer.',
  },
  {
    q: 'What does WeO cost?',
    a: 'You can start using WeO for free. Plans that add composer tools, marketplace insight and performance views start at $5.99/month.',
  },
  {
    q: 'Does WeO take a percentage when I sell something?',
    a: 'Yes — a 2% WeO Flow fee on each collect. It is itemised at preflight, before anything goes live, with what you receive beside it.',
  },
  {
    q: 'What is O?',
    a: 'O is the network’s flow unit — flow money, not a currency. 100 Os peg to $1. You earn Os through activity on WeO and move them inside the marketplace.',
  },
  {
    q: 'What is my O-wallet?',
    a: 'Your O-wallet holds your Os in four buckets — available, protected, pending and locked — so you always see what you can spend, not one blurred balance.',
  },
  {
    q: 'How do I get paid when someone Collects my WeO?',
    a: 'Payment happens as part of the exchange, based on the payment terms you set in your WeO.',
  },
  {
    q: 'What happens after I Collect a WeO?',
    a: "The exchange moves forward based on the terms of the WeO — such as payment, delivery, pickup, scheduling or redemption. You'll be able to see what happens next and follow the exchange through completion.",
  },
  {
    q: "How do I know I can trust the person I'm exchanging with?",
    a: "WeO builds a record of successful exchanges over time, so you can see a person's history and reliability before deciding to exchange with them.",
  },
  {
    q: 'What happens if something goes wrong with an exchange?',
    a: "If an exchange isn't completed as agreed, WeO provides a process to report the problem and work toward a resolution.",
  },
  {
    q: 'Can I cancel or refund a WeO?',
    a: 'That depends on the terms of the WeO and where you are in the exchange. Before you Collect, you can review the terms. After an exchange begins, cancellations and refunds follow the terms that were agreed to.',
  },
  {
    q: 'Can I resell a WeO I’ve Collected?',
    a: 'Yes, when the WeO allows resale. You can offer a WeO you’ve Collected to someone else, subject to the terms set by its creator.',
  },
  {
    q: 'What does it mean to remix a WeO?',
    a: 'Remixing lets you use an existing WeO as the starting point for a new offer. You can add your own value, change what’s being offered, or combine it with something else to create a new WeO.',
  },
  {
    q: 'Can I combine different WeOs?',
    a: 'Yes, when their terms allow it. You can combine WeOs with other products, services or offers to create something new.',
  },
  {
    q: 'Can I create a WeO for a service or appointment?',
    a: 'Yes. WeOs can be used for services and appointments as well as products. You can include the service, price, availability and other terms people need to Collect it.',
  },
  {
    q: 'Can I create a WeO for an event or experience?',
    a: 'Yes. You can create a WeO for an event, experience, class, activity or other time-based offer. Set the date, availability, price and terms, then post it like any other WeO.',
  },
  {
    q: 'Can I use WeO for my business?',
    a: 'Yes. You can use WeO to post offers, find buyers, respond to demand and build direct relationships with the people who interact with your business.',
  },
  {
    q: 'How does WeO help me get customers?',
    a: 'WeO creates a direct, real-time exchange between you and the people who discover and interact with your WeOs — and gives you ongoing access to everyone in your WeO network.',
  },
  {
    q: 'What does “build your own marketplace” mean?',
    a: 'There’s no algorithm or gatekeeper between you and your customers. You exchange directly and create an ongoing connection with everyone in your WeO network.',
  },
  {
    q: 'Can I see how my WeOs are performing?',
    a: 'Yes. You can see the activity around your WeOs — what people are discovering, Collecting and exchanging, and how that activity develops over time.',
  },
  {
    q: 'Can I see where my WeOs go when people share them?',
    a: 'Yes. WeO can show you how your WeOs move through your marketplace, including where activity is happening and how people are interacting with them.',
  },
  {
    q: 'What is Flow?',
    a: 'Flow shows you all of your marketplace activity in real time. You can see how your WeOs are moving, where people are interacting with them and how your marketplace is developing.',
  },
  {
    q: 'What can I learn about my marketplace?',
    a: 'You can see what people are interested in, what they’re Collecting and exchanging, where activity is happening, and how that activity changes over time.',
  },
  {
    q: 'Can I see what people are looking to buy?',
    a: 'Yes. Because buyers can post WeOs too, you can see real demand from people looking for products, services and experiences.',
  },
  {
    q: 'Can WeO help me decide what to offer?',
    a: 'Yes. WeO can help you understand demand, pricing and activity in your marketplace so you can make better decisions about what to offer and how to offer it.',
  },
  {
    q: 'Can I respond directly to demand?',
    a: 'Yes. When someone posts what they want to buy, you can respond directly with an offer that meets their needs.',
  },
  {
    q: 'Can I control who can Collect my WeO?',
    a: 'Yes. You can set the terms for who can Collect your WeO and any conditions they need to meet.',
  },
  {
    q: 'Can I make a WeO available only to certain people?',
    a: 'Yes. You can create WeOs for specific people, groups or communities, as well as WeOs that are available more broadly.',
  },
  {
    q: 'Can I create recurring or subscription WeOs?',
    a: 'Subscription WeOs are coming soon. They sit on the Create ring now — tap Notify me and I will tell you the moment they open.',
  },
  {
    q: 'Can more than one person Collect the same WeO?',
    a: 'Yes, if you create it that way. You can make a WeO available to one person or many people and set how many are available.',
  },
  {
    q: 'Can I create different offers for different customers?',
    a: 'Yes. You can create different WeOs for different people, groups or situations, with different prices, terms or benefits.',
  },
  {
    q: 'Can I use WeO with a group or community?',
    a: 'Yes. WeO can be used by groups and communities to buy, sell and exchange directly with each other. Members can create and Collect WeOs and build activity around the things they value.',
  },
  {
    q: 'Can my team use WeO for our business?',
    a: 'Yes. Business plans can support multiple people working together to create and manage WeOs and marketplace activity.',
  },
  {
    q: 'Can I use WeO in my local community?',
    a: 'Yes. You can use WeO to discover, buy and sell products, services and experiences around you — and build direct connections with people and businesses in your community.',
  },
  {
    q: 'Is WeO only for businesses?',
    a: "No. Anyone can use WeO to buy, sell or exchange. You might use it for your business, something you make, a service you provide, something you own, or simply something you're looking for.",
  },
  {
    q: 'Where should I start?',
    a: 'Discover what is happening now — or make your offer. Pick a format on the Create ring, name it, set a figure, and preflight shows you the fees before it goes live.',
  },
];

const STOP = new Set(
  'what,does,mean,when,with,that,this,from,your,have,into,them,they,than,then,about,there,where,which,should,could,would,will,just,only,some,more,most,also,into,after,before,over,under,weo,weos,can,the,and,for,are,you,how,who,why,its,use,get,one,any,all,not,but,out'.split(
    ',',
  ),
);
const words = (s: string) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, '');

/** design `myaAnswer(q)` — best FAQ entry by shared keywords; exact question echoes win. */
export function matchFaq(q: string, pool: readonly MyaQa[] = MYA_FAQ): MyaQa | null {
  const qs = words(q).map(stem);
  if (!qs.length) return null;
  let best: MyaQa | null = null;
  let bs = 0;
  for (const s of pool) {
    const ks = new Set(words(s.q).map(stem));
    let sc = qs.reduce((a, w) => a + (ks.has(w) ? 1 : 0), 0);
    if (String(q).trim().toLowerCase() === s.q.toLowerCase()) sc += 10;
    if (sc > bs) {
      bs = sc;
      best = s;
    }
  }
  return bs >= 1 ? best : null;
}

/** An FAQ entry whose question is exactly `q` (a starter tap, or typed verbatim). */
export const exactFaq = (q: string): MyaQa | null =>
  MYA_FAQ.find((s) => s.q.toLowerCase() === q.trim().toLowerCase()) ?? null;

/** design `MYA_STARTERS()` minus the mock market script: three about WeO itself. */
export const MYA_STARTERS: readonly MyaQa[] = [
  'What is a WeO?',
  'How do I post a WeO?',
  'Where should I start?',
]
  .map((t) => MYA_FAQ.find((x) => x.q === t))
  .filter((x): x is MyaQa => !!x);

/** design `sendMya` copy when nothing matches. */
export const MYA_NO_ANSWER =
  'I don’t have that one yet. Ask me what a WeO is, how to post one, what it costs, or what moved in your Circles this week.';
