const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'antigravity@test.cz' }
  });
  
  if (!user || !user.password) {
    console.log('USER NOT FOUND OR NO PASSWORD');
    return;
  }
  
  const passwordToTest = 'Password123!';
  const isValid = await bcrypt.compare(passwordToTest, user.password);
  console.log(`PASSWORD "${passwordToTest}" IS VALID:`, isValid);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
