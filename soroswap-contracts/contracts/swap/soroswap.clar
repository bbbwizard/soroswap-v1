(impl-trait .ownable.ownable-trait)
(use-trait ft-token .sip-010.sip010-ft-trait)
(use-trait pair-token .pair.pair-trait)

;; core data structure
(define-map all-pairs
  { pair-id: uint }
  {
    token-x: principal,
    token-y: principal,
  }
)

(define-map pairs-data-map
  {
    token-x: principal,
    token-y: principal,
  }
  {
    shares-total: uint,
    balance-x: uint,
    balance-y: uint,
    fee-balance-x: uint,
    fee-balance-y: uint,
    fee-to-address: (optional principal),
    pair-token: principal,
    name: (string-ascii 32),
  }
)

;; error 
(define-constant ERR-NOT-AUTHORIZED (err u1000))
(define-constant ERR-INVALID-PAIR (err u1001))
(define-constant ERR-PAIR-EXISTS (err u1002))
(define-constant ERR-OUT-OF-RANGE (err u1003))
(define-constant ERR-TRANSFER-X (err u1004))
(define-constant ERR-TRANSFER-Y (err u1005))
(define-constant ERR-OUT-OF-SLIPPAGE (err u1006))
(define-constant ERR-INVALID-AMOUNT (err u1007))
(define-constant ERR-NO-FEE-TO-ADDRESS (err u1008))

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

;; pair
(define-data-var pair-count uint u0)

(define-read-only (get-pair-count)
  (ok (var-get pair-count))
)

(define-read-only (get-name (token-x-trait <ft-token>) (token-y-trait <ft-token>))
  (let
    (
      (token-x (contract-of token-x-trait))
      (token-y (contract-of token-y-trait))
      (pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) ERR-INVALID-PAIR))
    )
    (ok (get name pair))
  )
)

(define-public (get-symbol (token-x-trait <ft-token>) (token-y-trait <ft-token>))
  (ok
    (concat
      (unwrap-panic (as-max-len? (unwrap-panic (contract-call? token-x-trait get-symbol)) u20))
      (concat "-"
        (unwrap-panic (as-max-len? (unwrap-panic (contract-call? token-y-trait get-symbol)) u20))
      )
    )
  )
)

(define-read-only (get-total-supply (token-x-trait <ft-token>) (token-y-trait <ft-token>))
  (let
    (
      (token-x (contract-of token-x-trait))
      (token-y (contract-of token-y-trait))
      (pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) ERR-INVALID-PAIR))
    )
    (ok (get shares-total pair))
  )
)

(define-public (get-balances (token-x-trait <ft-token>) (token-y-trait <ft-token>))
  (let
    (
      (token-x (contract-of token-x-trait))
      (token-y (contract-of token-y-trait))
      (pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) ERR-INVALID-PAIR))
    )
    (ok (list (get balance-x pair) (get balance-y pair)))
  )
)

(define-read-only (get-pair (token-x principal) (token-y principal))
  (let (
    (pair (map-get? pairs-data-map { token-x: token-x, token-y: token-y }))
  )
    (if (is-some pair)
      (ok pair)
      ERR-INVALID-PAIR
    )
  )
)

;; liquidity
(define-public (add-to-position (token-x-trait <ft-token>) (token-y-trait <ft-token>) (pair-token-trait <pair-token>) (x uint) (y uint))
  (begin
    (asserts! (> x u0) ERR-INVALID-AMOUNT)
    (let
      (
        (token-x (contract-of token-x-trait))
        (token-y (contract-of token-y-trait))
        (pair (unwrap-panic (map-get? pairs-data-map { token-x: token-x, token-y: token-y })))
        (contract-address (as-contract tx-sender))
        (recipient-address tx-sender)
        (balance-x (get balance-x pair))
        (balance-y (get balance-y pair))
        (pair-token (get pair-token pair))
        (new-shares
          (if (is-eq (get shares-total pair) u0)
            (sqrti (* x y)) 
            (/ (* x (get shares-total pair)) balance-x)
          )
        )
        (new-y
          (if (is-eq (get shares-total pair) u0)
            y
            (/ (* x balance-y) balance-x)
          )
        )
        (pair-updated (merge pair {
          shares-total: (+ new-shares (get shares-total pair)),
          balance-x: (+ balance-x x),
          balance-y: (+ balance-y new-y)
        }))
      )
      (asserts! (and (> x u0) (> new-y u0)) ERR-INVALID-AMOUNT)
      (asserts! (is-eq pair-token (contract-of pair-token-trait)) ERR-INVALID-PAIR)

      (asserts! (is-ok (contract-call? token-x-trait transfer x tx-sender contract-address none)) ERR-TRANSFER-X)
      (asserts! (is-ok (contract-call? token-y-trait transfer new-y tx-sender contract-address none)) ERR-TRANSFER-Y)

      (map-set pairs-data-map { token-x: token-x, token-y: token-y } pair-updated)
      (try! (contract-call? pair-token-trait mint new-shares recipient-address))

      (print { object: "pair", action: "Provide Liquidity", data: pair-updated })
      (ok true)
    )
  )
)

(define-public (create-pair (token-x-trait <ft-token>) (token-y-trait <ft-token>) (pair-token-trait <pair-token>) (pair-name (string-ascii 32)) (x uint) (y uint))
  (let
    (
      (token-x (contract-of token-x-trait))
      (token-y (contract-of token-y-trait))
      (name-x (unwrap-panic (contract-call? token-x-trait get-name)))
      (name-y (unwrap-panic (contract-call? token-y-trait get-name)))
      (pair-id (+ (var-get pair-count) u1))
      (pair-data {
        shares-total: u0,
        balance-x: u0,
        balance-y: u0,
        fee-balance-x: u0,
        fee-balance-y: u0,
        fee-to-address: none,
        pair-token: (contract-of pair-token-trait),
        name: pair-name,
      })
    )
    (try! (check-owner))
    (asserts!
      (and
        (is-none (map-get? pairs-data-map { token-x: token-x, token-y: token-y }))
        (is-none (map-get? pairs-data-map { token-x: token-y, token-y: token-x }))
      )
      ERR-PAIR-EXISTS
    )
    (map-set pairs-data-map { token-x: token-x, token-y: token-y } pair-data)
    (map-set all-pairs { pair-id: pair-id } { token-x: token-x, token-y: token-y })
    (var-set pair-count pair-id)
    (try! (add-to-position token-x-trait token-y-trait pair-token-trait x y))
    (print { object: "pair", action: "Creat Pair", data: pair-data })
    (ok true)
  )
)

(define-public (reduce-position (token-x-trait <ft-token>) (token-y-trait <ft-token>) (pair-token-trait <pair-token>) (percent uint))
  (let
    (
      (token-x (contract-of token-x-trait))
      (token-y (contract-of token-y-trait))
      (pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) ERR-INVALID-PAIR))
      (balance-x (get balance-x pair))
      (balance-y (get balance-y pair))
      (pair-token (get pair-token pair))
      (shares (unwrap-panic (contract-call? pair-token-trait get-balance tx-sender)))
      (shares-total (get shares-total pair))
      (contract-address (as-contract tx-sender))
      (sender tx-sender)
      (withdrawal (/ (* shares percent) u100))
      (withdrawal-x (/ (* withdrawal balance-x) shares-total))
      (withdrawal-y (/ (* withdrawal balance-y) shares-total))
      (pair-updated
        (merge pair
          {
            shares-total: (- shares-total withdrawal),
            balance-x: (- (get balance-x pair) withdrawal-x),
            balance-y: (- (get balance-y pair) withdrawal-y)
          }
        )
      )
    )
    (asserts! (<= percent u100) ERR-OUT-OF-RANGE)
    (asserts! (is-eq pair-token (contract-of pair-token-trait)) ERR-INVALID-PAIR)
    (asserts! (is-ok (as-contract (contract-call? token-x-trait transfer withdrawal-x contract-address sender none))) ERR-TRANSFER-X)
    (asserts! (is-ok (as-contract (contract-call? token-y-trait transfer withdrawal-y contract-address sender none))) ERR-TRANSFER-Y)

    (map-set pairs-data-map { token-x: token-x, token-y: token-y } pair-updated)
    (try! (contract-call? pair-token-trait burn withdrawal tx-sender))
    (print { object: "pair", action: "Remove Liquidity", data: pair-updated })
    (ok (list withdrawal-x withdrawal-y))
  )
)

;; swap
(define-constant fee-basis-points u5) ;; 5 bp for protocol
(define-constant fee-factor u997) ;; 30 bp fee

(define-public (swap-x-for-y (token-x-trait <ft-token>) (token-y-trait <ft-token>) (dx uint) (min-dy uint))
  (begin
    (asserts! (> dx u0) ERR-INVALID-AMOUNT)
    (let
      (
        (token-x (contract-of token-x-trait))
        (token-y (contract-of token-y-trait))
        (pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) ERR-INVALID-PAIR))
        (balance-x (get balance-x pair))
        (balance-y (get balance-y pair))
        (contract-address (as-contract tx-sender))
        (sender tx-sender)
        (dy (/ (* fee-factor balance-y dx) (+ (* u1000 balance-x) (* fee-factor dx))))
        (fee (/ (* fee-basis-points dx) u10000))
        (pair-updated
          (merge pair
            {
              balance-x: (+ balance-x dx),
              balance-y: (- balance-y dy),
              ;; only collect fee when fee-to-address is set
              fee-balance-x: (if (is-some (get fee-to-address pair))
                (+ fee (get fee-balance-x pair))
                (get fee-balance-x pair))
            }
          )
        )
      )
      
      (asserts! (< min-dy dy) ERR-OUT-OF-SLIPPAGE)
      (asserts! (is-ok (contract-call? token-x-trait transfer dx sender contract-address none)) ERR-TRANSFER-X)
      (asserts! (is-ok (as-contract (contract-call? token-y-trait transfer dy contract-address sender none))) ERR-TRANSFER-Y)
      (map-set pairs-data-map { token-x: token-x, token-y: token-y } pair-updated)
      (print { object: "pair", action: "Swap X For Y", data: pair-updated })
      (ok (list dx dy))
    )
  )
)

(define-public (swap-y-for-x (token-y-trait <ft-token>) (token-x-trait <ft-token>) (dy uint) (min-dx uint))
  (begin
    (asserts! (> dy u0) ERR-INVALID-AMOUNT)
    (let  
      (
        (token-x (contract-of token-x-trait))
        (token-y (contract-of token-y-trait))
        (pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) ERR-INVALID-PAIR))
        (balance-x (get balance-x pair))
        (balance-y (get balance-y pair))
        (contract-address (as-contract tx-sender))
        (sender tx-sender)
        (dx (/ (* fee-factor balance-x dy) (+ (* u1000 balance-y) (* fee-factor dy))))
        (fee (/ (* fee-basis-points dx) u10000))
        (pair-updated (merge pair {
            balance-x: (- balance-x dx),
            balance-y: (+ balance-y dy),
            fee-balance-y: (if (is-some (get fee-to-address pair))
              (+ fee (get fee-balance-y pair))
              (get fee-balance-y pair))
          })
        )
      )
      (asserts! (< min-dx dx) ERR-OUT-OF-SLIPPAGE)
      (asserts! (is-ok (as-contract (contract-call? token-x-trait transfer dx contract-address sender none))) ERR-TRANSFER-X)
      (asserts! (is-ok (contract-call? token-y-trait transfer dy sender contract-address none)) ERR-TRANSFER-Y)
      (map-set pairs-data-map { token-x: token-x, token-y: token-y } pair-updated)
      (print { object: "pair", action: "Swap Y For X", data: pair-updated })
      (ok (list dx dy))
    )
  )
)

(define-public (set-fee-to-address (token-x principal) (token-y principal) (address principal))
  (let (
      (pair (unwrap-panic (map-get? pairs-data-map { token-x: token-x, token-y: token-y })))
      (pair-updated (merge pair { fee-to-address: (some address) }))
    )
    (try! (check-owner))
    (map-set pairs-data-map { token-x: token-x, token-y: token-y } pair-updated)
    (ok true)
  )
)

(define-read-only (get-fee-to-address (token-x principal) (token-y principal))
  (let ((pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) ERR-INVALID-PAIR)))
    (ok (get fee-to-address pair))
  )
)

(define-read-only (get-fees (token-x principal) (token-y principal))
  (let ((pair (unwrap! (map-get? pairs-data-map { token-x: token-x, token-y: token-y }) ERR-INVALID-PAIR)))
    (ok (list (get fee-balance-x pair) (get fee-balance-y pair)))
  )
)

(define-public (collect-fees (token-x-trait <ft-token>) (token-y-trait <ft-token>))
  (let 
    (
      (token-x (contract-of token-x-trait))
      (token-y (contract-of token-y-trait))
      (contract-address (as-contract tx-sender))
      (pair (unwrap-panic (map-get? pairs-data-map { token-x: token-x, token-y: token-y })))
      (address (unwrap! (get fee-to-address pair) ERR-NO-FEE-TO-ADDRESS))
      (fee-x (get fee-balance-x pair))
      (fee-y (get fee-balance-y pair))
      (pair-updated
        (merge pair
          {
            fee-balance-x: u0, 
            fee-balance-y: u0
          }
        )
      )
    )

    (asserts!
      (or
        (> fee-y u0)
        (> fee-x u0)
      ) 
      ERR-INVALID-AMOUNT
    )

    (if (> fee-x u0)
      (begin
        (asserts! (is-ok  (as-contract (contract-call? token-x-trait transfer fee-x contract-address address none))) ERR-TRANSFER-X)
      )
      true
    )

    (if (> fee-y u0)
      (begin
        (asserts! (is-ok  (as-contract (contract-call? token-y-trait transfer fee-y contract-address address none))) ERR-TRANSFER-Y)
      )
      true
    )

    (map-set pairs-data-map { token-x: token-x, token-y: token-y } pair-updated)
    (print { object: "pair", action: "Claim Fee", data: pair-updated })
    (ok (list fee-x fee-y))
  )
)
