#!/usr/bin/env bash

# ==============================================================================
# OMNIA APP - PROXMOX LXC INSTALLATION SCRIPT
# Upute:
# 1. Ovaj kod se pokreće direktno unutar Proxmox Shell-a (ne unutar VM-a/LXC-a)
# 2. Prilagodite varijable ispod svojim potrebama prije pokretanja.
# 3. Zbog privatnog repozitorija potreban Vam je GitHub Personal Access Token (PAT).
# ==============================================================================

# --- KONFIGURACIJA KONTEJNERA ---
CTID=150                             # ID LXC Kontejnera (npr. 150)
HOSTNAME="omnia-app"                 # Ime kontejnera
CORES=2                              # Broj CPU jezgri
MEMORY=4096                          # Količina RAM memorije u MB
SWAP=512                             # Količina SWAP memorije u MB
DISK_SIZE="64"                       # Veličina diska u GB (samo broj)
NETWORK="name=eth0,bridge=vmbr0,ip=dhcp" # Mrežne postavke (dhcp će automatski dodijeliti IP)

# --- GITHUB POSTAVKE ---
GITHUB_USER="brada1983"
GITHUB_REPO="MBDesign-Omnia-App"

# --- ODABIR DISKA (INTERAKTIVNO) ---
echo "Dostupni diskovi (Storage) na Vašem Proxmoxu:"
pvesm status | awk 'NR>1 {print "- " $1 " (" $2 ", Slobodno: " $4 ")'
echo ""
read -p "Unesite ime Storage-a gdje želite kreirati LXC (zadano: local-lvm): " STORAGE
STORAGE=${STORAGE:-local-lvm}

# 1. Preuzimanje Debian 12 (Bookworm) template-a ako već ne postoji
echo "Provjeravam lokalne LXC templateove..."
TEMPLATE=$(pvesm list local -content vztmpl | grep 'debian-12' | awk '{print $1}' | head -n 1)

if [ -z "$TEMPLATE" ]; then
    echo "Preuzimam Debian 12 template..."
    pveam update
    pveam download local debian-12-standard_12.2-1_amd64.tar.zst
    TEMPLATE="local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst"
fi
echo "Koristit ću template: $TEMPLATE"

# 2. Kreiranje LXC Kontejnera
echo "Kreiram LXC kontejner $CTID..."
pct create $CTID $TEMPLATE \
    --hostname $HOSTNAME \
    --cores $CORES \
    --memory $MEMORY \
    --swap $SWAP \
    --rootfs ${STORAGE}:${DISK_SIZE} \
    --net0 $NETWORK \
    --unprivileged 1 \
    --features nesting=1

# 3. Pokretanje kontejnera
echo "Pokrećem kontejner $CTID..."
pct start $CTID
echo "Čekam na učitavanje mreže..."
sleep 15

# 4. Instalacija potrebnih paketa unutar LXC-a (Node.js, Git, PM2, SQLite)
echo "Instaliram Node.js, Git i ostale alate (npm, PM2)..."
pct exec $CTID -- bash -c "apt-get update && apt-get upgrade -y"
pct exec $CTID -- bash -c "apt-get install -y curl git make g++ build-essential sqlite3"
pct exec $CTID -- bash -c "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
pct exec $CTID -- bash -c "apt-get install -y nodejs"
pct exec $CTID -- bash -c "npm install -g pm2"

# 5. Preuzimanje aplikacije s GitHub-a u '/opt/omnia'
echo "Kloniram veřejni (public) GitHub repozitorij..."
pct exec $CTID -- bash -c "git clone https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git /opt/omnia"

# 6. Dodavanje .env datoteke i instalacija NPM modula
echo "Podešavam okruženje i .env datoteku..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Kreiranje .env na hostu pa prebacivanje u LXC
cat << EOF > /tmp/omnia.env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="http://localhost:3000"
# Postavite svoje postavke maila naknadno uredivanjem fajla unutar LXC-a
SMTP_HOST="mail.mbdesign.hr"
SMTP_PORT=465
SMTP_USER="ai@mbdesign.hr"
SMTP_PASS=""
EOF

pct push $CTID /tmp/omnia.env /opt/omnia/.env
rm /tmp/omnia.env

echo "Instaliram NPM module..."
pct exec $CTID -- bash -c "cd /opt/omnia && npm install"

# 7. Postavljanje Baze (Prisma Push & Generate)
echo "Postavljam SQLite bazu..."
pct exec $CTID -- bash -c "cd /opt/omnia && npx prisma generate"
pct exec $CTID -- bash -c "cd /opt/omnia && npx prisma db push"
pct exec $CTID -- bash -c "cd /opt/omnia && npx prisma db seed"

# 8. Build Next.js aplikacije
echo "Provodim build (Next.js) aplikacije... Ovo može potrajati par minuta."
pct exec $CTID -- bash -c "cd /opt/omnia && npm run build"

# 9. Pokretanje aplikacije putem PM2 managera
echo "Pokrećem server..."
pct exec $CTID -- bash -c "cd /opt/omnia && pm2 start npm --name 'omnia-app' -- start"
pct exec $CTID -- bash -c "pm2 save"
# Postavljanje PM2 da se pali prilikom restarta kontejnera
pct exec $CTID -- bash -c "pm2 startup systemd -u root --hp /root && pm2 save"

# 10. Kreiranje skripte za ažuriranje (update-app.sh)
echo "Kreiram skriptu za automatsko ažuriranje..."
pct exec $CTID -- bash -c "cat << 'EOF' > /root/update-app.sh
#!/usr/bin/env bash
echo '================================================================='
echo ' ZAPOČINJEM AŽURIRANJE SUSTAVA I APLIKACIJE'
echo '================================================================='
echo '[1/5] Ažuriram Debian pakete...'
apt-get update -y && apt-get upgrade -y && apt-get autoremove -y

echo '[2/5] Provjeravam novosti s GitHuba...'
cd /opt/omnia
git stash
GIT_PULL_OUTPUT=\$(git pull origin main)

if [[ \$GIT_PULL_OUTPUT == *'Already up to date.'* ]]; then
    echo 'Kod aplikacije je već na zadnjoj verziji. Preskačem build aplikacije.'
else
    echo 'Pronađen je novi kod! Radim instalaciju zavisnosti i build...'
    echo '[3/5] Instaliram NPM pakete...'
    npm install
    echo '[4/5] Osvježavam Prisma bazu podataka...'
    npx prisma generate
    npx prisma db push
    echo '[5/5] Pokrećem Next.js Production Build...'
    npm run build
    echo '[+] Ponovno pokrećem aplikaciju unutar PM2...'
    pm2 restart omnia-app
fi
echo '================================================================='
echo '✅ AŽURIRANJE JE ZAVRŠENO!'
echo '================================================================='
EOF"
pct exec $CTID -- bash -c "chmod +x /root/update-app.sh"

# 11. Prikupljanje IP Adrese
sleep 2 # Dajemo malo vremena da se servisi poslože
LXC_IP=$(pct exec $CTID -- ip -4 -o addr show eth0 | awk '{print $4}' | cut -d "/" -f 1)

echo ""
echo "================================================================="
echo "✅ INSTALACIJA JE ZAVRŠENA!"
echo "================================================================="
echo "Vaša aplikacija trči unutar Proxmox LXC kontejnera (ID: $CTID)."
echo ""
echo "🌐 Aplikaciji možete pristupiti preko preglednika na linku:"
echo "   ---> http://${LXC_IP}:3000"
echo ""
echo "Pristupni podaci za prijavu u aplikaciju (prema Prisma seederu):"
echo "E-mail: marko@mbdesign.hr"
echo "Lozinka: Marko2023"
echo ""
echo "Za detaljne postavke unutar kontejnera upišite:"
echo "pct enter $CTID"
echo "cd /opt/omnia"
echo "nano .env (Za dodavanje SMTP lozinke)"
echo ""
echo "Za ažuriranje sustava i aplikacije u budućnosti upišite:"
echo "pct exec $CTID -- /root/update-app.sh"
echo "================================================================="
