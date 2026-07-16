# Actor's Studio — Product Roadmap & Tier 3 Backlog

This document outlines the long-term vision, future phases (Tier 3), and explicit non-goals for the Actor's Studio platform. These items are excluded from the initial Tier 1 (MVP) and Tier 2 builds to ensure development velocity and focus.

---

## 🚀 Tier 3 Backlog (Future Enhancements)

The following features will be planned and architected once the core loops of Tiers 1 & 2 are validated in production:

### 🧠 Intelligent Matchmaking & AI
1. **AI Bio Generator:** LLM-assisted profile copywriting to help talent write engaging professional bios.
2. **AI Talent Recommendation:** Algorithm matching casting calls to profiles based on requirements, metrics, and tags.
3. **AI Face Search / Duplicate Detection:** Vector embedding pipeline for image matching and identifying duplicate profiles.

### 🎥 Media & Audition Technology
4. **Self-Tape Recording Suite:** In-browser self-tape recording with direct auto-upload capabilities to Supabase Storage.

### 💳 Financial & Compliance Ecosystem
5. **Escrow Payments:** Payment holding mechanisms until casting/booking completion, along with a dispute resolution workflow.
6. **Multi-Gateway Local Integration:** Adding JazzCash and EasyPaisa alongside the default Stripe payment portal.
7. **Background-Check Hook:** Integrated provider hooks for background screening and security vetting.

### 📱 Distribution & Scalability
8. **Mobile Applications:** Companion React Native apps for iOS & Android reusing the existing Supabase REST/PostgREST layers.
9. **White-Label Agency Sites:** Sub-agency portals and micro-sites for premium agency partners.
10. **Multi-Language Support (Localization):** High-fidelity Urdu and English interface toggle.

### 📈 Growth & Education
11. **Referral Program:** Referral engines for talent-to-talent and producer-to-producer loops.
12. **Academy / Training Module:** Integrated masterclasses, workshops, and coaching modules.
13. **Analytics Dashboard:** Conversion funnels for casting directors and detailed profile-view statistics for talent.

---

## 🚫 Explicit Non-Goals for Initial Builds

During the development of Tiers 1 & 2, the following practices are strictly out of scope:
- Developing custom video-transcoding servers (use third-party services like Cloudinary if needed).
- Building native iOS/Android applications.
- Supporting international multi-currency pricing models beyond PKR and USD.
