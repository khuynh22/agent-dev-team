Reported by finance: splitting 100 cents across 3 recipients returns 33, 33, 33.
One cent disappears. Every split that does not divide evenly loses money.

The remainder should be distributed one cent at a time to the earliest recipients,
so `split(100, 3)` is `[34, 33, 33]`.
