<div align="center">

![snaplet-snapshot-logo](https://github.com/snaplet/examples/assets/8771783/6fe2cb7d-d7b6-4038-a4ab-cee1f5b792b6)

</div>

# Snaplet Snapshot Examples

In this directory, you'll find examples illustrating the use of Snaplet's `snapshot` feature. Snaplet `snapshot` enables you to safely capture and transform a portion of your production database for use in development environments.

## Understanding Snaplet Snapshot

Snaplet Snapshot captures a subset of your production data, transforming it to ensure that sensitive information is protected. This functionality is crucial for developers who need realistic data without compromising the integrity and security of the original data.

## Examples

Each example here provides a practical scenario where Snaplet `snapshot` can be applied, showcasing its flexibility and utility in various development contexts.

### How to Use

1. **Capture Your Database Snapshot**: Connect Snaplet to your production database and capture a snapshot, choosing whether to subset and/or transform the data.
2. **Install Snaplet CLI**: Use the CLI to manage your snapshots and integrate them into your development workflow.
3. **Restore the Snapshot**: Restore the captured snapshot into your development database for use in coding and testing.

For step-by-step guidance, see the README.md in each example subdirectory.

## Resources

- [Snapshot Quick Start Guide](https://docs.snaplet.dev/getting-started/quick-start/snapshot)