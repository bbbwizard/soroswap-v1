(impl-trait .ownable.ownable-trait)
(use-trait ft-token .sip-010.sip010-ft-trait)

;; error
(define-constant ERR-NOT-AUTHORIZED (err u1000))
(define-constant ERR-EXCEEDS-MAX-TIME (err u1001))
(define-constant ERR-TRANSFER-FAUCET (err u1002))

;; ownable
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

;; faucet
(define-constant MAX_TIME u2)

(define-map user-records principal uint)

(define-public (deposit-faucet (token-trait <ft-token>) (amount uint))
  (begin
    (try! (check-owner))
    (let 
      (
        (contract-address (as-contract tx-sender))
        (sender tx-sender)
      )
      (asserts! (is-ok (contract-call? token-trait transfer amount sender contract-address none)) ERR-TRANSFER-FAUCET)
      (ok true)
    )
  )
)

(define-public (get-faucet-token (recipient principal) (token-trait <ft-token>) (amount uint))
  (begin
    (match (map-get? user-records recipient)
      old-use
      (begin
          (asserts! (<= (+ u1 old-use) MAX_TIME) ERR-EXCEEDS-MAX-TIME)
          (map-set user-records recipient (+ u1 old-use))
      )
      (map-set user-records recipient u1)
    )
    (let 
      (
        (contract-address (as-contract tx-sender))
      )
      (asserts! (is-ok (as-contract (contract-call? token-trait transfer amount contract-address recipient none))) ERR-TRANSFER-FAUCET)
      (ok true)
    )
  )
)
