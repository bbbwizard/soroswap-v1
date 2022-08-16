(impl-trait .sip-010.sip010-ft-trait)
(impl-trait .ownable.ownable-trait)

(define-fungible-token wusdc)
(define-data-var uri (string-utf8 256) u"")

;; error
(define-constant ERR-NOT-AUTHORIZED (err u100))

;; Ownable
(define-data-var contract-owner principal tx-sender)

(define-read-only (get-owner)
  (ok (var-get contract-owner))
)

(define-private (check-owner)
  (ok (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED))
)

(define-public (transfer-ownership (owner principal))
  (begin
    (try! (check-owner))
    (ok (var-set contract-owner owner))
  )
)

;; sip-010
(define-read-only (get-total-supply)
  (ok (ft-get-supply wusdc))
)

(define-read-only (get-name)
  (ok "Wrapped USDC")
)
(define-read-only (get-symbol)
  (ok "WUSDC")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance wusdc account))
)

(define-read-only (get-token-uri)
  (ok (some (var-get uri)))
)

(define-public (set-token-uri (value (string-utf8 256)))
  (begin
    (try! (check-owner))
    (ok (var-set uri value))
  )
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq sender tx-sender) ERR-NOT-AUTHORIZED)
    (match (ft-transfer? wusdc amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)

;; test
(define-public (mint (amount uint) (recipient principal))
  (begin
    (try! (check-owner))
    (ft-mint? wusdc amount recipient)
  )
)

(define-public (burn (amount uint) (sender principal))
  (begin
    (try! (check-owner))
    (ft-burn? wusdc amount sender)
  )
)
