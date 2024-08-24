/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
	// Obter a URL da requisição
	const url = new URL(request.url);

	// Obter o tipo de página a partir do parâmetro de consulta 'pageType'
	const pageType = url.searchParams.get('pageType') || 'default';

	// Definir uma chave específica para o tipo de página
	const counterKey = `visitors_counter_${pageType}`;

	// Obter chave única para o cliente (por exemplo, usando o IP ou outra identificação)
	const clientId = request.headers.get('CF-Connecting-IP') || 'unknown';

	// Crie uma chave única para evitar duplicatas
	const lastVisitKey = `last_visit_${clientId}_${pageType}`;
	const lastVisit = await visitorCounter.get(lastVisitKey);

	const now = Date.now();

	// Ignore se a última visita foi muito recente (ex: 1 segundo)
	if (lastVisit && (now - parseInt(lastVisit)) < 1000) {
		return new Response('Error', {
			headers: {
				'content-type': 'text/plain',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type'
			}
		});
	}

	// Atualiza a última visita para o cliente atual
	await visitorCounter.put(lastVisitKey, now.toString());

	// Incrementar o contador para o tipo de página específico
	let count = await visitorCounter.get(counterKey);

	if (count === null) {
		count = 0;
	} else {
		count = parseInt(count);
	}

	count += 1;

	await visitorCounter.put(counterKey, count.toString());

	return new Response(`{"counter": ${count}}`, {
		headers: {
			'content-type': 'text/plain',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
}
