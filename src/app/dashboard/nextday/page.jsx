import Footer from '../../components/Footer';
import PricesPanel from '../../components/PrincesPanel';
export default function nexdayPage() {
  return (
    <div className="min-h-screen flex flex-col">
      
      <main className="flex-grow bg-[#0c0c14] text-white">
      <PricesPanel/>
      </main>

      <Footer />
    </div>
  );
}