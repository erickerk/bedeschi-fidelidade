import { getReviews } from '../src/lib/reviews-api';

async function testReviewsAPI() {
  console.log('=== TESTE DA API DE REVIEWS ===\n');
  
  try {
    const reviews = await getReviews();
    console.log(`Total de reviews carregadas: ${reviews.length}`);
    
    if (reviews.length > 0) {
      console.log('\nExemplos:');
      reviews.slice(0, 3).forEach((r, i) => {
        console.log(`${i + 1}. Rating: ${r.rating}, Profissional: ${r.professional_name || 'N/A'}`);
      });
      
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      console.log(`\nMédia: ${avg.toFixed(1)} ⭐`);
    } else {
      console.log('❌ Nenhuma review carregada!');
    }
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
}

testReviewsAPI();
