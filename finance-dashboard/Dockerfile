# ---------- Dependencies ----------
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci

# ---------- Builder ----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBTe_rVZe9aKDj2R9A8DLkGHjjqMKeR6cQ
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pocketflow-f4414.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=pocketflow-f4414
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pocketflow-f4414.firebasestorage.app
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=367281432279
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:367281432279:web:6267c734a9c0423854f292
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-1NEX3746NG
RUN npm run build

# ---------- Runner ----------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]