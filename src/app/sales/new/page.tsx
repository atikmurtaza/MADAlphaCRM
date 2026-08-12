import { PrismaClient } from '@prisma/client';
import NewSaleForm from './NewSaleForm';

const prisma = new PrismaClient();

export default async function NewSalePage() {
  const agents = await prisma.user.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="card max-w-2xl mx-auto">
      <h2>Create New Sale</h2>
      <p className="text-secondary text-sm" style={{ marginBottom: '2rem' }}>
        Enter new sales here. This instantly creates the client, logs the payment, and sends the project to the Execution Manager queue. No Google Sheets required!
      </p>
      
      <NewSaleForm agents={agents} />
    </div>
  );
}
