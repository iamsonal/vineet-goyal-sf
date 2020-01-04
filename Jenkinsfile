/*
 * You can find the latest release tag at https://git.soma.salesforce.com/dci/sfci-pipeline-sharedlib/releases
 */
@Library('sfci-pipeline-sharedlib@master')

def envDef = [ buildImage: 'ops0-artifactrepo1-0-prd.data.sfdc.net/dci/centos-sfci-nodejs:d7e5a3d' ]

// define any release branches here
env.RELEASE_BRANCHES = ['master']

env.CI = true;
env.SAUCE_USERNAME = 'lwc_ci'
env.SAUCE_KEY = 'ca71d9ad-af28-4c2b-abf7-1ddaa87fed36'
env.SAUCE_TUNNEL_ID = '${BUILD_TAG}'

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
        sh 'yarn test:unit --runInBand --ci --coverage'
    }

    // TODO: uncomment when tunneling is setup between the Jenkins and SauceLabs
    // stage('TEST - INTEGRATION') {
    //     // start_sauce_connect
    //     // Be mindfull when upgrading the version of sauce connect. Saucelabs' support acknowledged that the 4.5.2 and
    //     // 4.5.3 versions have some issues related to tunnel creation.
    //     sh 'curl https://saucelabs.com/downloads/sc-4.5.1-linux.tar.gz -o saucelabs.tar.gz'
    //     sh 'tar -xzf saucelabs.tar.gz'
    //     sh 'cd sc-* && bin/sc -u ${SAUCE_USERNAME} -k ${SAUCE_KEY} -i ${SAUCE_TUNNEL_ID}'
    //     // wait_for_sauce_connect
    //     sh 'wget --retry-connrefused --no-check-certificate -T 60 localhost:4445'
    //     // run_integration_tests
    //     sh 'yarn test:integration'
    //     // run_integration_tests_compat
    //     sh 'yarn test:integration:compat'
    //     // stop_sauce_connect
    //     sh 'kill -9 `cat /tmp/sc_client-${SAUCE_TUNNEL_ID}.pid`'
    // }
}
