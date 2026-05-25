import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  const admin = await prisma.user.upsert({
    where: { phone: '+50912345678' },
    update: {},
    create: {
      phone: '+50912345678',
      name: 'Admin HaitiBet',
      passwordHash: await bcrypt.hash('admin123', 12),
      status: 'ACTIVE',
      isAdmin: true,
    },
  });

  console.log('Admin created:', admin.phone);

  // Sample match: Haiti vs Jamaica
  const match = await prisma.match.upsert({
    where: { externalId: 'HTI-JAM-2025-001' },
    update: {},
    create: {
      externalId: 'HTI-JAM-2025-001',
      homeTeam: 'Haïti',
      awayTeam: 'Jamaïque',
      competition: 'Qualifications CONCACAF',
      venue: 'Stade Sylvio Cator, Port-au-Prince',
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'SCHEDULED',
    },
  });

  console.log('Match created:', match.homeTeam, 'vs', match.awayTeam);

  // Match Result market
  const market = await prisma.market.create({
    data: {
      matchId: match.id,
      name: 'Résultat du match (1X2)',
      category: 'MATCH_RESULT',
      status: 'OPEN',
      outcomes: {
        create: [
          { name: 'Victoire Haïti', code: 'H' },
          { name: 'Match nul', code: 'D' },
          { name: 'Victoire Jamaïque', code: 'A' },
        ],
      },
    },
    include: { outcomes: true },
  });

  // Set initial odds
  const probabilities = [
    { code: 'H', prob: 0.40 },
    { code: 'D', prob: 0.28 },
    { code: 'A', prob: 0.32 },
  ];

  for (const outcome of market.outcomes) {
    const p = probabilities.find((x) => x.code === outcome.code)!;
    const impliedWithMargin = p.prob / 1.05;
    const odds = 1 / impliedWithMargin;

    await prisma.odds.create({
      data: {
        outcomeId: outcome.id,
        value: parseFloat(odds.toFixed(4)),
        margin: 0.05,
        version: 1,
        isActive: true,
      },
    });
  }

  console.log('Market created with odds:', market.name);

  // Goals market
  const goalsMarket = await prisma.market.create({
    data: {
      matchId: match.id,
      name: 'Plus/Moins de 2.5 buts',
      category: 'GOALS',
      status: 'OPEN',
      outcomes: {
        create: [
          { name: 'Plus de 2.5', code: 'OVER' },
          { name: 'Moins de 2.5', code: 'UNDER' },
        ],
      },
    },
    include: { outcomes: true },
  });

  for (const outcome of goalsMarket.outcomes) {
    await prisma.odds.create({
      data: {
        outcomeId: outcome.id,
        value: outcome.code === 'OVER' ? 2.1 : 1.75,
        margin: 0.05,
        version: 1,
        isActive: true,
      },
    });
  }

  console.log('Goals market created');
  console.log('Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
