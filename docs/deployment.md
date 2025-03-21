# Deployment

Pictshare Book is currently deployed according to the following diagram:

![Deployment Diagram](/assets/deployment-diagram.png)

Since this repository is setup to use trunk-based development, deployment to staging is automatic from the master branch,
while deployment to production happens upon creation of a new release tag.

The staging environment on both fly.io and vercel are setup to deploy changes to the master branch as soon as possible,
while the production environment waits for all tests to pass before deploying.
