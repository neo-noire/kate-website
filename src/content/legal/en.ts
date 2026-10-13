import { ACCESS_MONTHS } from "@/lib/catalog/access";
import type { Business } from "./business";
import type { LegalDoc, LegalDocument } from "./types";

export function englishLegal(b: Business): Record<LegalDoc, LegalDocument> {
  return {
    terms: {
      title: "Terms of Service",
      intro: `These terms apply when you create an account on ${b.brand} or buy a course. ${b.brand} is operated by ${b.legalName} ("we", "us"). By creating an account or making a purchase, you agree to these terms, our Privacy Policy and our Refund Policy.`,
      sections: [
        {
          heading: "Your account",
          body: [
            "You need an account to buy and watch courses. Give us accurate details and keep your password private. You are responsible for what happens under your account.",
            "You must be at least 18 years old to create an account or buy a course.",
            "An account is for one person. Please don't share your login.",
          ],
        },
        {
          heading: "What you buy",
          body: [
            "Each dance is a separate course of video lessons. When you buy a course in a package (for example Solo, Personal or Mentorship), you get:",
            [
              "a personal, non-transferable right to watch that course's lessons online for your own learning;",
              "any private lessons the package includes, as described on the course page.",
            ],
            `Your access to a course's lessons lasts ${ACCESS_MONTHS} months from the date of purchase. Your dashboard shows the date it ends. After that, you can buy the course again, including any newer version of it.`,
            "Our courses keep evolving, so lessons may be improved, replaced or added over time. While your access lasts, we won't remove a lesson from your course unless we replace it with something of similar value.",
            "If we stop offering a course before your access ends, we will refund the unused part of what you paid or give you access to a similar course.",
          ],
        },
        {
          heading: "Private lessons",
          body: [
            "Private lessons included in a package are scheduled with your coach on a separate booking platform, not on this site. That platform's own rules apply to booking, rescheduling and missed sessions.",
            "Private lessons must be used within 6 months of your purchase, even though access to the videos ends sooner. If you can't make it in time, contact us before that date and we will try to work something out.",
          ],
        },
        {
          heading: "Prices and payment",
          body: [
            "Prices are shown in Canadian dollars (CAD) unless the page says otherwise. Applicable sales taxes (such as GST/HST or PST) are added at checkout.",
            "Payments are processed by Stripe. We never see or store your full card number.",
            "You will receive a receipt by email after your purchase.",
            "We may change prices for future purchases. A price change never affects a course you have already bought.",
          ],
        },
        {
          heading: "Refunds",
          body: ["Refunds are covered by our Refund Policy, which is part of these terms."],
        },
        {
          heading: "Using the lessons",
          body: [
            "The videos, music choices, choreography, text and materials belong to us or our licensors. You may not:",
            [
              "download, record, copy or share the lessons or their links;",
              "resell or publicly show the lessons, or use them to teach others;",
              "try to get around the site's access controls.",
            ],
            "If you break these rules, we may suspend or close your account. Where the breach is serious, we won't refund your purchase.",
          ],
        },
        {
          heading: "Your health and safety",
          body: [
            "Dancing is physical activity. Warm up, practise in a safe and clear space, wear suitable shoes and listen to your body. If you have a health condition, an injury or are pregnant, check with a doctor before you start.",
            "Our lessons are general instruction, not medical or physiotherapy advice. To the extent the law allows, you practise at your own risk.",
          ],
        },
        {
          heading: "Our responsibility",
          body: [
            "We work hard to keep the site and lessons available, but we can't promise they will always be uninterrupted or error-free.",
            "To the extent the law allows, our total liability for any claim connected with a course is limited to the amount you paid for that course. We are not liable for indirect or consequential losses.",
            "Nothing in these terms limits rights you have under consumer protection law that can't be excluded.",
          ],
        },
        {
          heading: "Closing your account",
          body: [
            `You can ask us to close your account at any time by writing to ${b.email}. Closing your account ends your access to your courses. Our Refund Policy explains when you can get money back.`,
          ],
        },
        {
          heading: "Changes to these terms",
          body: [
            "We may update these terms. We will post the new version here with a new date, and tell you by email if a change is significant. Changes don't apply to purchases made before them.",
          ],
        },
        {
          heading: "Governing law",
          body: [
            `These terms are governed by the laws of ${b.province.en} and the federal laws of Canada that apply there. If you live in another province, you also keep the protections of your own province's consumer laws.`,
          ],
        },
        {
          heading: "Contact",
          body: [`Questions about these terms? Write to us at ${b.email}.`],
        },
      ],
    },

    privacy: {
      title: "Privacy Policy",
      intro: `This policy explains what personal information ${b.brand} collects, why, and what you can do about it. ${b.legalName} is responsible for your information and follows Canada's Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable provincial privacy laws.`,
      sections: [
        {
          heading: "What we collect",
          body: [
            [
              "Account details: your name, email address and password. Passwords are stored only as a secure hash, never in readable form.",
              "If you sign in with Google: your name, email address and profile picture from Google. We never see your Google password.",
              "Course activity: the courses you own, the package you chose, when your access ends, when you first played a paid lesson of each course (this decides whether a refund is possible), the lessons you mark as completed and the notes you write in your dashboard.",
              "Purchases: what you bought, when, and the amount. Card details go directly to Stripe, our payment processor; we only receive a confirmation and the last digits of the card.",
              "Messages you send us: your name, email address and what you wrote.",
              "Technical data: your IP address and browser type, stored with your sign-in session to keep your account secure, and in our hosting provider's short-lived server logs.",
            ],
          ],
        },
        {
          heading: "Why we use it",
          body: [
            [
              "to create and secure your account;",
              "to give you access to the courses you bought and remember your progress and notes;",
              "to take payments and keep the records that tax law requires;",
              "to answer your messages and provide support;",
              "to send emails about your account and purchases, such as receipts and password resets;",
              "to send course news and tips, only if you subscribed. You can unsubscribe at any time.",
            ],
            "We don't sell your personal information, and we don't use advertising trackers.",
          ],
        },
        {
          heading: "Cookies and browser storage",
          body: [
            [
              "A sign-in cookie keeps you logged in. It is required for your account to work.",
              "A language cookie remembers the language you chose.",
              "Your browser's local storage keeps a few preferences on your device.",
            ],
            "Lesson videos are embedded from YouTube in privacy-enhanced mode, so YouTube doesn't set cookies when the page loads. When you press play, YouTube (Google) may store data on your device and receive information about your viewing, under Google's privacy policy.",
          ],
        },
        {
          heading: "Who we share it with",
          body: [
            "We share information only with service providers that help us run the site, and only what each one needs:",
            [
              "Vercel: website hosting;",
              "Neon: our database;",
              "Stripe: payment processing;",
              "Google: optional sign-in, and YouTube for lesson videos;",
              "Resend: sending emails.",
            ],
            "These providers may store and process information in the United States or other countries outside Canada, where it may be accessible to authorities under local law. We choose providers that protect personal information to a standard comparable to Canadian law.",
            "We may also disclose information when the law requires it.",
          ],
        },
        {
          heading: "How long we keep it",
          body: [
            "We keep your account information, progress and notes while your account is open. If you ask us to delete your account, we delete them within 30 days.",
            "We keep purchase and payment records for 6 years, as Canadian tax law requires, even after your account is deleted.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "You can ask us to:",
            [
              "tell you what personal information we hold about you and give you a copy;",
              "correct information that is wrong;",
              "delete your account and information, except records we must keep by law;",
              "stop sending you marketing emails (you can also use the unsubscribe link in any of them).",
            ],
            `Write to ${b.email}. We will reply within 30 days.`,
            "If you're not satisfied with our answer, you can complain to the Office of the Privacy Commissioner of Canada (priv.gc.ca). Residents of Quebec can also contact the Commission d'accès à l'information du Québec.",
          ],
        },
        {
          heading: "Security",
          body: [
            "We use encrypted connections (HTTPS), store passwords as secure hashes and limit who can access your information. No system is perfectly secure; if a breach puts you at real risk of significant harm, we will tell you and the Privacy Commissioner as the law requires.",
          ],
        },
        {
          heading: "Children",
          body: [
            "The site is for adults. You must be 18 or older to create an account, and we don't knowingly collect information about anyone younger. If you believe a minor has created an account, contact us and we will delete it.",
          ],
        },
        {
          heading: "Changes to this policy",
          body: [
            "We will post any update here with a new date, and tell you by email if a change significantly affects how we use your information.",
          ],
        },
        {
          heading: "Contact",
          body: [`Privacy questions or requests: ${b.email}.`],
        },
      ],
    },

    refunds: {
      title: "Refund Policy",
      intro: "We want you to enjoy your lessons. If a course isn't right for you, here is how refunds work.",
      sections: [
        {
          heading: "14-day guarantee",
          body: [
            "You can get a full refund within 14 days of your purchase if both of these are true:",
            [
              "you haven't played any paid lesson of the course yet (free preview lessons don't count);",
              "none of the private lessons included in your package has taken place yet.",
            ],
            "Once you play a lesson, you have seen the content you paid for, so the course can no longer be refunded. Our site records the first time you play a paid lesson of each course.",
          ],
        },
        {
          heading: "After a private lesson",
          body: [
            "Once a private lesson from your package has taken place, the package can no longer be refunded, because your coach has reserved and given that time to you.",
          ],
        },
        {
          heading: "Technical problems",
          body: [
            "If you can't watch a course because of a problem on our side and we can't fix it, we will refund you in full, whenever it happens.",
          ],
        },
        {
          heading: "How to ask for a refund",
          body: [
            `Email ${b.email} from the email address on your account, and tell us which course you'd like refunded. You don't have to give a reason.`,
            "We send refunds to the original payment method within 10 business days of approving them. Your bank may take a few more days to show it. When a course is refunded, your access to it ends.",
          ],
        },
        {
          heading: "Your legal rights",
          body: [
            "This policy doesn't limit any right to cancel or get a refund that you have under the consumer protection law of your province.",
          ],
        },
      ],
    },
  };
}
