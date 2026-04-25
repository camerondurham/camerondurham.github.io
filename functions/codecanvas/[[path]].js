const CODECANVAS_ORIGIN = 'https://camerondurham.github.io';
const CODECANVAS_BASE_PATH = '/codecanvas';

export async function onRequest(context) {
	const requestUrl = new URL(context.request.url);

	if (requestUrl.pathname === CODECANVAS_BASE_PATH) {
		requestUrl.pathname = `${CODECANVAS_BASE_PATH}/`;
		return Response.redirect(requestUrl.toString(), 308);
	}

	const upstreamUrl = new URL(CODECANVAS_ORIGIN);
	upstreamUrl.pathname = requestUrl.pathname;
	upstreamUrl.search = requestUrl.search;

	const upstreamResponse = await fetch(upstreamUrl.toString(), {
		method: context.request.method,
		headers: context.request.headers,
		body: ['GET', 'HEAD'].includes(context.request.method) ? undefined : context.request.body,
		redirect: 'follow'
	});

	const headers = new Headers(upstreamResponse.headers);
	headers.delete('content-length');

	return new Response(upstreamResponse.body, {
		status: upstreamResponse.status,
		statusText: upstreamResponse.statusText,
		headers
	});
}
