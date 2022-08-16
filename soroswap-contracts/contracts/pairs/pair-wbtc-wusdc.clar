(impl-trait .pair.pair-trait)
(impl-trait .ownable.ownable-trait)

(define-fungible-token wbtc-wusdc-token)
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
  (ok (ft-get-supply wbtc-wusdc-token))
)

(define-read-only (get-name)
  (ok "WBTC-WUSDC LP Token")
)

(define-read-only (get-symbol)
  (ok "WBTC-WUSDC-LP")
)

(define-read-only (get-decimals)
  (ok u8)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance wbtc-wusdc-token account))
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
    (match (ft-transfer? wbtc-wusdc-token amount sender recipient)
      response (begin
        (print memo)
        (ok response)
      )
      error (err error)
    )
  )
)

;; pair-trait
(define-public (mint (amount uint) (recipient principal))
  (begin
    (try! (check-owner))
    (ft-mint? wbtc-wusdc-token amount recipient)
  )
)

(define-public (burn (amount uint) (sender principal))
  (begin
    (try! (check-owner))
    (ft-burn? wbtc-wusdc-token amount sender)
  )
)