# GYMX Guardian — container image (untested until Docker is available on a build machine).
# Zero runtime dependencies: Node 24 runs the TypeScript sources directly.
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    GUARDIAN_HOST=0.0.0.0 \
    GUARDIAN_PORT=8787 \
    GUARDIAN_DEMO_DATA=false
COPY package.json ./
COPY src ./src
COPY admin ./admin
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD node -e "fetch('http://127.0.0.1:8787/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/main.ts"]
