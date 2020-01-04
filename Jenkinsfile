/*
 * You can find the latest release tag at https://git.soma.salesforce.com/dci/sfci-pipeline-sharedlib/releases
 */
@Library('sfci-pipeline-sharedlib@master')

def envDef = [ buildImage: 'ops0-artifactrepo1-0-prd.data.sfdc.net/dci/centos-sfci-nodejs:d7e5a3d' ]

// define any release branches here
env.RELEASE_BRANCHES = ['master']

executePipeline(envDef) {
    stage('Init') {
        // uncomment following lines to debug
        // sh 'printenv'
        // echo 'NodeJS version:'
        // sh 'node -v'
        // echo 'Yarn version:'
        // sh 'yarn -v'

        echo 'Checking out source...'
        checkout scm
        npmInit()
    }

    // Common step for PRs and release builds
    stage('BUILD') {
        echo 'Install dependencies'
        sh 'yarn install --frozen-lockfile'
    }

    stage('CHECK') {
        echo 'run format'
        sh 'yarn format:check'
        echo 'run linting'
        sh 'yarn lint'
    }

    stage('TEST - UNIT') {
        echo 'Run unit tests with coverage'
        // Jest should run sequentially instead of parallel on the CI to avoid running out of memory and
        // reduce run duration.
        // https://jestjs.io/docs/en/troubleshooting#tests-are-extremely-slow-on-docker-and-or-continuous-integration-ci-server        
        sh 'yarn test --runInBand --ci --coverage'
    }

    stage('BUNDLE SIZE CHECK') {
        echo 'Run bundle size check'
        sh 'yarn test:size'
    }
}
