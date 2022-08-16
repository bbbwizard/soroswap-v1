(define-trait ownable-trait
	(
		(get-owner () (response principal uint))
		(transfer-ownership (principal) (response bool uint))
	)
)