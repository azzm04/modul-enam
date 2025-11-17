// app/src/components/Pagination.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  itemsPerPage,
  totalItems 
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <View style={styles.container}>
      {/* Info Text */}
      <Text style={styles.infoText}>
        Showing {startItem}-{endItem} of {totalItems}
      </Text>

      {/* Pagination Controls */}
      <View style={styles.controls}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[
            styles.button,
            currentPage === 1 && styles.buttonDisabled
          ]}
          onPress={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Ionicons 
            name="chevron-back" 
            size={20} 
            color={currentPage === 1 ? '#ccc' : '#2563eb'} 
          />
          <Text style={[
            styles.buttonText,
            currentPage === 1 && styles.buttonTextDisabled
          ]}>
            Sebelumnya
          </Text>
        </TouchableOpacity>

        {/* Page Numbers */}
        <View style={styles.pageNumbers}>
          {renderPageNumbers(currentPage, totalPages, onPageChange)}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[
            styles.button,
            currentPage === totalPages && styles.buttonDisabled
          ]}
          onPress={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Text style={[
            styles.buttonText,
            currentPage === totalPages && styles.buttonTextDisabled
          ]}>
            Berikutnya
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={currentPage === totalPages ? '#ccc' : '#2563eb'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function renderPageNumbers(currentPage, totalPages, onPageChange) {
  const pages = [];
  const maxVisible = 5; // Maximum page numbers to show

  if (totalPages <= maxVisible) {
    // Show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <PageButton
          key={i}
          page={i}
          isActive={i === currentPage}
          onPress={() => onPageChange(i)}
        />
      );
    }
  } else {
    // Show first page
    pages.push(
      <PageButton
        key={1}
        page={1}
        isActive={1 === currentPage}
        onPress={() => onPageChange(1)}
      />
    );

    // Show ellipsis if needed
    if (currentPage > 3) {
      pages.push(<Text key="ellipsis1" style={styles.ellipsis}>...</Text>);
    }

    // Show pages around current
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(
        <PageButton
          key={i}
          page={i}
          isActive={i === currentPage}
          onPress={() => onPageChange(i)}
        />
      );
    }

    // Show ellipsis if needed
    if (currentPage < totalPages - 2) {
      pages.push(<Text key="ellipsis2" style={styles.ellipsis}>...</Text>);
    }

    // Show last page
    pages.push(
      <PageButton
        key={totalPages}
        page={totalPages}
        isActive={totalPages === currentPage}
        onPress={() => onPageChange(totalPages)}
      />
    );
  }

  return pages;
}

function PageButton({ page, isActive, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.pageButton,
        isActive && styles.pageButtonActive
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.pageButtonText,
        isActive && styles.pageButtonTextActive
      ]}>
        {page}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fb',
    gap: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  buttonTextDisabled: {
    color: '#ccc',
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fb',
  },
  pageButtonActive: {
    backgroundColor: '#2563eb',
  },
  pageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  pageButtonTextActive: {
    color: '#fff',
  },
  ellipsis: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 4,
  },
});