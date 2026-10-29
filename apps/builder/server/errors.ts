export class HttpError extends Error {
	status: 400 | 404 | 409 | 413 | 415
	constructor(status: HttpError['status'], message: string) {
		super(message)
		this.status = status
	}
}
