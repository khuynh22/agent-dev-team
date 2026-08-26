Production runs four application instances behind a load balancer. Deploys are rolling:
old and new code serve traffic at the same time for roughly ten minutes.

`users` has about 30 million rows. There is no read replica.

We want to ship migration 003 and the matching service change this afternoon.
